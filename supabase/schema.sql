-- ============================================================
-- Gindi Studio — Supabase database
-- Run once in the Supabase SQL editor (or via the Management API).
-- Safe to re-run: it drops and recreates the app's own objects only.
--
-- Roles inside a company:
--   manager  — everything: approvals, custody, treasury, team, projects
--   office   — technical office: projects, tasks, progress; reads expenses
--   site     — site engineer: logs expenses (pending), own custody, own tasks
--   client   — sees only their project: progress, payments, approved spending
--   pending  — signed up with a join code, waiting for the manager
-- ============================================================

-- ---------- clean re-run ----------
drop trigger if exists on_auth_user_created on auth.users;
drop table if exists public.updates, public.tasks, public.transactions,
  public.project_members, public.projects, public.accounts,
  public.profiles, public.companies cascade;
drop function if exists public.handle_new_user, public.my_company, public.my_role,
  public.is_member, public.create_company, public.join_company,
  public.set_member, public.remove_member, public.update_progress, public.decide_expense cascade;

create extension if not exists pgcrypto;

-- ---------- tables ----------
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  join_code text not null unique default upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 6)),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  company_id uuid references public.companies on delete set null,
  full_name text not null default '',
  phone text,
  role text not null default 'pending'
    check (role in ('manager','office','site','client','pending')),
  created_at timestamptz not null default now()
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies on delete cascade,
  name text not null,
  type text not null check (type in ('bank','cash','wallet')),
  opening numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies on delete cascade,
  name text not null check (length(trim(name)) > 0),
  client_name text not null default '',
  location text not null default '',
  area numeric(10,2) not null default 0,
  progress int not null default 0 check (progress between 0 and 100),
  fee_type text not null default 'pct' check (fee_type in ('pct','fixed')),
  fee_value numeric(14,2) not null default 10 check (fee_value >= 0),
  show_fee boolean not null default true,
  items jsonb not null default '[]'::jsonb,   -- [{"k":"plumbing","b":85000}, ...]
  created_at timestamptz not null default now()
);

create table public.project_members (
  project_id uuid not null references public.projects on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  primary key (project_id, user_id)
);

-- One ledger for every money movement.
--   pay  : client payment into an account            (project, account)
--   exp  : expense — from an engineer's custody      (project, item, engineer_id)
--                  — or paid directly from account   (project, item, account_id)
--   give : custody handed to an engineer             (engineer_id, account_id)
--   xfer : custody moved between engineers           (engineer_id = from, to_engineer_id = to)
--   ret  : engineer returns custody cash             (engineer_id, account_id)
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies on delete cascade,
  kind text not null check (kind in ('pay','exp','give','xfer','ret')),
  project_id uuid references public.projects on delete cascade,
  item text,
  amount numeric(14,2) not null check (amount > 0),
  engineer_id uuid references public.profiles on delete set null,
  to_engineer_id uuid references public.profiles on delete set null,
  account_id uuid references public.accounts on delete set null,
  status text not null default 'approved' check (status in ('pending','approved','rejected')),
  vendor text,
  note text,
  receipt_path text,
  tx_date date not null default current_date,
  created_by uuid default auth.uid() references public.profiles on delete set null,
  decided_by uuid references public.profiles on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies on delete cascade,
  project_id uuid not null references public.projects on delete cascade,
  type text not null default 'task' check (type in ('task','snag')),
  title text not null check (length(trim(title)) > 0),
  assignee_id uuid references public.profiles on delete set null,
  due date,
  status text not null default 'todo' check (status in ('todo','doing','done')),
  created_by uuid default auth.uid() references public.profiles on delete set null,
  created_at timestamptz not null default now()
);

create table public.updates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies on delete cascade,
  project_id uuid not null references public.projects on delete cascade,
  author_id uuid references public.profiles on delete set null,
  progress int not null check (progress between 0 and 100),
  note text not null default '',
  created_at timestamptz not null default now()
);

create index on public.transactions (company_id, project_id);
create index on public.transactions (engineer_id);
create index on public.tasks (project_id);
create index on public.updates (project_id);
create index on public.project_members (user_id);

-- ---------- helpers (security definer so policies don't recurse) ----------
create function public.my_company() returns uuid
language sql stable security definer set search_path = public as $$
  select company_id from public.profiles where id = auth.uid()
$$;

create function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'pending')
$$;

create function public.is_member(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.project_members where project_id = p and user_id = auth.uid())
$$;

-- New sign-up → profile row (name comes from sign-up metadata).
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.raw_user_meta_data->>'phone')
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- actions (RPC) ----------
-- First user creates the company and becomes its manager, with three starter accounts.
create function public.create_company(company_name text, full_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare c uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if (select company_id from profiles where id = auth.uid()) is not null then
    raise exception 'already in a company';
  end if;
  insert into companies (name) values (trim(company_name)) returning id into c;
  update profiles set company_id = c, role = 'manager',
    full_name = coalesce(nullif(trim(create_company.full_name), ''), profiles.full_name)
  where id = auth.uid();
  insert into accounts (company_id, name, type) values
    (c, 'البنك', 'bank'), (c, 'الخزنة النقدية', 'cash'), (c, 'إنستاباي / فودافون كاش', 'wallet');
  return c;
end $$;

-- Everyone else joins with the company's code and waits for the manager.
create function public.join_company(code text, full_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare c uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if (select company_id from profiles where id = auth.uid()) is not null then
    raise exception 'already in a company';
  end if;
  select id into c from companies where join_code = upper(trim(code));
  if c is null then raise exception 'invalid code'; end if;
  update profiles set company_id = c, role = 'pending',
    full_name = coalesce(nullif(trim(join_company.full_name), ''), profiles.full_name)
  where id = auth.uid();
  return c;
end $$;

-- Manager sets a member's role and the projects they belong to.
create function public.set_member(member uuid, new_role text, project_ids uuid[]) returns void
language plpgsql security definer set search_path = public as $$
begin
  if my_role() <> 'manager' then raise exception 'manager only'; end if;
  if new_role not in ('manager','office','site','client','pending') then raise exception 'bad role'; end if;
  if not exists (select 1 from profiles where id = member and company_id = my_company()) then
    raise exception 'not in your company';
  end if;
  if member = auth.uid() and new_role <> 'manager' then raise exception 'keep yourself as manager'; end if;
  update profiles set role = new_role where id = member;
  delete from project_members pm using projects p
    where pm.project_id = p.id and p.company_id = my_company() and pm.user_id = member;
  insert into project_members (project_id, user_id)
    select p.id, member from projects p
    where p.id = any(coalesce(project_ids, '{}')) and p.company_id = my_company()
  on conflict do nothing;
end $$;

-- Remove a member from the company (manager only).
create function public.remove_member(member uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if my_role() <> 'manager' then raise exception 'manager only'; end if;
  if member = auth.uid() then raise exception 'cannot remove yourself'; end if;
  delete from project_members pm using projects p
    where pm.project_id = p.id and p.company_id = my_company() and pm.user_id = member;
  update profiles set company_id = null, role = 'pending' where id = member and company_id = my_company();
end $$;

-- Progress update from the site / office / manager, with a note for the feed.
create function public.update_progress(p uuid, new_progress int, note text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from projects where id = p and company_id = my_company()) then
    raise exception 'not found';
  end if;
  if not (my_role() in ('manager','office') or (my_role() = 'site' and is_member(p))) then
    raise exception 'not allowed';
  end if;
  update projects set progress = greatest(0, least(100, new_progress)) where id = p;
  insert into updates (company_id, project_id, author_id, progress, note)
    values (my_company(), p, auth.uid(), greatest(0, least(100, new_progress)), coalesce(note, ''));
end $$;

-- Manager approves or rejects a pending expense.
create function public.decide_expense(tx uuid, approve boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if my_role() <> 'manager' then raise exception 'manager only'; end if;
  update transactions set status = case when approve then 'approved' else 'rejected' end,
    decided_by = auth.uid(), decided_at = now()
  where id = tx and company_id = my_company() and kind = 'exp' and status = 'pending';
  if not found then raise exception 'not found'; end if;
end $$;

-- ---------- row level security ----------
alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.transactions enable row level security;
alter table public.tasks enable row level security;
alter table public.updates enable row level security;

-- companies: members read their own; manager renames
create policy companies_read on public.companies for select using (id = my_company());
create policy companies_update on public.companies for update
  using (id = my_company() and my_role() = 'manager') with check (id = my_company());

-- profiles: you always see yourself; approved members see the company's people
create policy profiles_read on public.profiles for select using (
  id = auth.uid() or (company_id = my_company() and my_role() <> 'pending'));
-- users may edit only their own name and phone (column grants below)
create policy profiles_update_self on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated, anon;
grant update (full_name, phone) on public.profiles to authenticated;

-- accounts: manager only
create policy accounts_manager on public.accounts for all
  using (company_id = my_company() and my_role() = 'manager')
  with check (company_id = my_company() and my_role() = 'manager');

-- projects: manager/office see all; site/client see their own; manager edits
create policy projects_read on public.projects for select using (
  company_id = my_company() and (my_role() in ('manager','office') or is_member(id)));
create policy projects_write on public.projects for all
  using (company_id = my_company() and my_role() = 'manager')
  with check (company_id = my_company() and my_role() = 'manager');

-- project members
create policy members_read on public.project_members for select using (
  user_id = auth.uid()
  or exists (select 1 from public.projects p where p.id = project_id and p.company_id = my_company()
             and (my_role() in ('manager','office') or is_member(p.id))));
create policy members_write on public.project_members for all
  using (my_role() = 'manager' and exists (select 1 from public.projects p where p.id = project_id and p.company_id = my_company()))
  with check (my_role() = 'manager' and exists (select 1 from public.projects p where p.id = project_id and p.company_id = my_company()));

-- transactions
create policy tx_manager on public.transactions for all
  using (company_id = my_company() and my_role() = 'manager')
  with check (company_id = my_company() and my_role() = 'manager');
create policy tx_office_read on public.transactions for select using (
  company_id = my_company() and my_role() = 'office' and kind in ('pay','exp'));
create policy tx_site_read on public.transactions for select using (
  company_id = my_company() and my_role() = 'site' and (
    engineer_id = auth.uid() or to_engineer_id = auth.uid()
    or (kind = 'exp' and is_member(project_id))));
create policy tx_client_read on public.transactions for select using (
  company_id = my_company() and my_role() = 'client' and is_member(project_id)
  and (kind = 'pay' or (kind = 'exp' and status = 'approved')));
-- site engineers can only submit pending expenses from their own custody, on their projects
create policy tx_site_insert on public.transactions for insert with check (
  company_id = my_company() and my_role() = 'site' and kind = 'exp'
  and status = 'pending' and engineer_id = auth.uid() and account_id is null
  and to_engineer_id is null and decided_by is null and is_member(project_id));

-- tasks
create policy tasks_read on public.tasks for select using (
  company_id = my_company() and (my_role() in ('manager','office') or is_member(project_id)));
create policy tasks_insert on public.tasks for insert with check (
  company_id = my_company() and (my_role() in ('manager','office')
    or (my_role() = 'site' and is_member(project_id))));
create policy tasks_update on public.tasks for update
  using (company_id = my_company() and (my_role() in ('manager','office') or (my_role() = 'site' and assignee_id = auth.uid())))
  with check (company_id = my_company());
create policy tasks_delete on public.tasks for delete using (
  company_id = my_company() and my_role() in ('manager','office'));

-- updates feed (written through update_progress)
create policy updates_read on public.updates for select using (
  company_id = my_company() and (my_role() in ('manager','office') or is_member(project_id)));

-- functions: signed-in users only
revoke execute on all functions in schema public from public, anon;
grant execute on function public.my_company, public.my_role, public.is_member,
  public.create_company, public.join_company, public.set_member, public.remove_member,
  public.update_progress, public.decide_expense to authenticated;

-- ---------- receipt photos (private bucket, one folder per company) ----------
insert into storage.buckets (id, name, public) values ('receipts', 'receipts', false)
  on conflict (id) do nothing;
drop policy if exists receipts_insert on storage.objects;
drop policy if exists receipts_read on storage.objects;
create policy receipts_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'receipts' and (storage.foldername(name))[1] = my_company()::text
  and my_role() in ('manager','office','site'));
create policy receipts_read on storage.objects for select to authenticated using (
  bucket_id = 'receipts' and (storage.foldername(name))[1] = my_company()::text
  and my_role() in ('manager','office','site'));

-- ---------- live updates ----------
do $$ begin
  begin alter publication supabase_realtime add table public.transactions; exception when others then null; end;
  begin alter publication supabase_realtime add table public.tasks; exception when others then null; end;
  begin alter publication supabase_realtime add table public.updates; exception when others then null; end;
  begin alter publication supabase_realtime add table public.projects; exception when others then null; end;
  begin alter publication supabase_realtime add table public.profiles; exception when others then null; end;
end $$;
