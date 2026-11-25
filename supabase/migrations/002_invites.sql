-- ============================================================
-- Gindi Studio — migration 002: personal invites + mobile sign-in
-- Run once in the Supabase SQL editor. Safe to re-run; it does NOT touch existing data.
--
--   invites                 — a manager adds a person (name, mobile, role, projects) and
--                             gets a one-time link to send on WhatsApp
--   invite_info(token)      — the invite screen reads who it is for (works before sign-in)
--   accept_invite(token)    — after the person creates their account, puts them straight
--                             into the company with the role and projects the manager chose
--   reset_member_password() — the manager sets a new password for a mobile-number account
-- Mobile-number accounts sign in with an internal address m<mobile>@phone.gindi-studio.com;
-- no email is ever sent to it.
-- ============================================================

create table if not exists public.invites (
  token text primary key default replace(gen_random_uuid()::text, '-', ''),
  company_id uuid not null references public.companies on delete cascade,
  full_name text not null check (length(trim(full_name)) > 0),
  phone text not null check (phone ~ '^[0-9]{8,15}$'),
  role text not null check (role in ('manager','office','site','client')),
  project_ids uuid[] not null default '{}',
  created_by uuid default auth.uid() references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days',
  used_by uuid references public.profiles on delete set null,
  used_at timestamptz
);
create index if not exists invites_company on public.invites (company_id);

alter table public.invites enable row level security;
drop policy if exists invites_manager on public.invites;
create policy invites_manager on public.invites for all
  using (company_id = public.my_company() and public.my_role() = 'manager')
  with check (company_id = public.my_company() and public.my_role() = 'manager');

-- What the invite screen shows. Only someone holding the link's token can read it.
create or replace function public.invite_info(tok text)
returns table (company_name text, full_name text, phone text, role text, status text)
language sql stable security definer set search_path = public as $$
  select c.name, i.full_name, i.phone, i.role,
         case when i.used_at is not null then 'used'
              when i.expires_at < now() then 'expired'
              else 'ok' end
  from public.invites i join public.companies c on c.id = i.company_id
  where i.token = tok
$$;

-- Called by the newly signed-up (or signed-in) person right after they open the link.
create or replace function public.accept_invite(tok text) returns uuid
language plpgsql security definer set search_path = public as $$
declare inv public.invites; cur uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select * into inv from public.invites where token = tok for update;
  if not found then raise exception 'invalid invite'; end if;
  if inv.used_at is not null then
    if inv.used_by = auth.uid() then return inv.company_id; end if;
    raise exception 'invite already used';
  end if;
  if inv.expires_at < now() then raise exception 'invite expired'; end if;
  select company_id into cur from public.profiles where id = auth.uid();
  if cur is not null and cur <> inv.company_id then raise exception 'already in a company'; end if;
  update public.profiles
     set company_id = inv.company_id, role = inv.role,
         full_name = inv.full_name, phone = coalesce(nullif(phone, ''), inv.phone)
   where id = auth.uid();
  insert into public.project_members (project_id, user_id)
    select p.id, auth.uid() from public.projects p
    where p.id = any(inv.project_ids) and p.company_id = inv.company_id
  on conflict do nothing;
  update public.invites set used_by = auth.uid(), used_at = now() where token = tok;
  return inv.company_id;
end $$;

-- Manager sets a new password for a member who signs in with a mobile number.
create or replace function public.reset_member_password(member uuid, new_password text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare em text;
begin
  if public.my_role() <> 'manager' then raise exception 'manager only'; end if;
  if member = auth.uid() then raise exception 'use forgot password for your own account'; end if;
  if not exists (select 1 from public.profiles where id = member and company_id = public.my_company()) then
    raise exception 'not in your company';
  end if;
  if length(coalesce(new_password, '')) < 6 then raise exception 'Password should be at least 6 characters'; end if;
  select email into em from auth.users where id = member;
  if em is null or em not like '%@phone.gindi-studio.com' then
    raise exception 'email account: use forgot password';
  end if;
  update auth.users set encrypted_password = crypt(new_password, gen_salt('bf')), updated_at = now()
   where id = member;
end $$;

revoke execute on function public.invite_info(text), public.accept_invite(text),
  public.reset_member_password(uuid, text) from public, anon;
grant execute on function public.invite_info(text) to anon, authenticated;
grant execute on function public.accept_invite(text), public.reset_member_password(uuid, text) to authenticated;
