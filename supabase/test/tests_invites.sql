\set ON_ERROR_STOP on
\pset tuples_only on
\pset format unaligned
-- manager + company + project (as in tests.sql, minimal)
insert into auth.users (id, raw_user_meta_data, email) values
 ('00000000-0000-0000-0000-0000000000a1','{"full_name":"Boss"}','boss@example.com'),
 ('00000000-0000-0000-0000-0000000000b1','{}','m01001234567@phone.gindi-studio.com'),
 ('00000000-0000-0000-0000-0000000000b2','{}','m01111111111@phone.gindi-studio.com'),
 ('00000000-0000-0000-0000-0000000000e1','{"full_name":"Email person"}','person@example.com'),
 ('00000000-0000-0000-0000-0000000000f1','{"full_name":"Other boss"}','other@example.com');
create temp table k (n text primary key, v text); grant all on k to authenticated, anon;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000a1',false); set role authenticated;
select public.create_company('Gindi','Boss') is not null;
insert into projects (company_id,name) values (my_company(),'P1'),(my_company(),'P2');
insert into invites (company_id,full_name,phone,role,project_ids) values (my_company(),'هشام رضا','01001234567','client',array[(select id from projects where name='P1')]) returning 'manager created invite';
insert into k select 'tok', token from invites where phone='01001234567';
insert into invites (company_id,full_name,phone,role,expires_at) values (my_company(),'Late','01222222222','site',now()-interval '1 day');
insert into k select 'old', token from invites where phone='01222222222';
insert into invites (company_id,full_name,phone,role) values (my_company(),'Email','01033333333','office');
insert into k select 'em', token from invites where phone='01033333333';
reset role;
-- anon reads invite info
select set_config('request.jwt.claim.sub','',false); set role anon;
select 'anon invite_info: '||string_agg(company_name||' / '||full_name||' / '||phone||' / '||role||' / '||status,'') from public.invite_info((select v from k where n='tok'));
select test.expect_fail('anon reads invites table', $$select count(*) from invites$$);
select 'anon wrong token rows: '||count(*) from public.invite_info('nope');
select test.expect_fail('anon accept_invite', format($$select public.accept_invite('%s')$$,(select v from k where n='tok')));
reset role;
-- invitee signs up (phone account) and accepts
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000b1',false); set role authenticated;
select 'pending sees invites: '||count(*) from invites;
select public.accept_invite((select v from k where n='tok')) is not null;
select 'after accept: role='||role||' name='||full_name||' phone='||coalesce(phone,'') from profiles where id=auth.uid();
select 'client sees projects: '||string_agg(name,',') from projects;
select 'same user accepts again ok: '||(public.accept_invite((select v from k where n='tok')) is not null);
select test.expect_fail('client creates invite', $$insert into invites (company_id,full_name,phone,role) values (my_company(),'x','01000000000','manager')$$);
select test.expect_fail('client resets someone password', $$select public.reset_member_password('00000000-0000-0000-0000-0000000000a1','hacked123')$$);
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000b2',false); set role authenticated;
select test.expect_fail('second person reuses invite', format($$select public.accept_invite('%s')$$,(select v from k where n='tok')));
select test.expect_fail('expired invite', format($$select public.accept_invite('%s')$$,(select v from k where n='old')));
reset role;
-- someone already in another company can't be pulled in
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000f1',false); set role authenticated;
select public.create_company('Other','X') is not null;
select test.expect_fail('member of another company accepts', format($$select public.accept_invite('%s')$$,(select v from k where n='em')));
select test.expect_fail('other company manager resets our member', $$select public.reset_member_password('00000000-0000-0000-0000-0000000000b1','hacked123')$$);
select 'other company sees our invites: '||count(*) from invites;
reset role;
-- email person accepts the office invite, then password reset rules
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000e1',false); set role authenticated;
select public.accept_invite((select v from k where n='em')) is not null;
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000a1',false); set role authenticated;
select public.reset_member_password('00000000-0000-0000-0000-0000000000b1','NewPass99');
select test.expect_fail('reset email account', $$select public.reset_member_password('00000000-0000-0000-0000-0000000000e1','NewPass99')$$);
select test.expect_fail('reset with short password', $$select public.reset_member_password('00000000-0000-0000-0000-0000000000b1','123')$$);
select 'invites seen by manager: '||count(*)||' (used: '||count(used_at)||')' from invites;
reset role;
select 'password works after reset: '||(encrypted_password = crypt('NewPass99', encrypted_password)) from auth.users where id='00000000-0000-0000-0000-0000000000b1';
select 'ALL INVITE TESTS PASSED';
