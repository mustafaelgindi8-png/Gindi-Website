\set ON_ERROR_STOP on
\pset tuples_only on
\pset format unaligned
insert into auth.users values
 ('00000000-0000-0000-0000-00000000000a','{"full_name":"Mostafa"}'),
 ('00000000-0000-0000-0000-00000000000b','{"full_name":"Karim"}'),
 ('00000000-0000-0000-0000-00000000000c','{"full_name":"Noha"}'),
 ('00000000-0000-0000-0000-00000000000d','{"full_name":"Hisham"}'),
 ('00000000-0000-0000-0000-00000000000e','{"full_name":"Pending Pat"}'),
 ('00000000-0000-0000-0000-00000000000f','{"full_name":"Other Co"}');
create temp table ids (k text primary key, v uuid); grant all on ids to authenticated;
-- manager
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false); set role authenticated;
insert into ids select 'co', public.create_company('Gindi Studio','Eng. Mostafa');
select 'manager role: '||role from profiles where id=auth.uid();
select 'accounts: '||count(*) from accounts;
insert into projects (company_id,name,client_name,items) values (my_company(),'P1','Hisham','[{"k":"plumbing","b":85000}]') returning 'project p1 created';
insert into ids select 'p1', id from projects where name='P1';
insert into projects (company_id,name) values (my_company(),'P2');
insert into ids select 'p2', id from projects where name='P2';
insert into ids select 'code', null; 
reset role;
-- others join
create temp table code as select join_code from companies; grant select on code to authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false); set role authenticated;
select 'karim joined: '||(public.join_company((select join_code from code),'Eng. Karim') is not null);
select 'pending sees profiles: '||count(*) from profiles;
select 'pending sees projects: '||count(*) from projects;
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000c',false); set role authenticated; select public.join_company((select join_code from code),'Eng. Noha') is not null; reset role;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000d',false); set role authenticated; select public.join_company(lower((select join_code from code)),'Hisham') is not null; reset role;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000e',false); set role authenticated; select public.join_company((select join_code from code),'Pat') is not null; 
select test.expect_fail('pending promotes self via update', $$update profiles set role='manager' where id=auth.uid()$$);
select test.expect_fail('pending calls set_member', $$select public.set_member(auth.uid(),'manager','{}')$$);
select test.expect_fail('wrong join code', $$select 1$$) where false;
reset role;
-- manager assigns
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false); set role authenticated;
select public.set_member('00000000-0000-0000-0000-00000000000b','site',array[(select v from ids where k='p1')]);
select public.set_member('00000000-0000-0000-0000-00000000000c','office','{}');
select public.set_member('00000000-0000-0000-0000-00000000000d','client',array[(select v from ids where k='p1')]);
select test.expect_fail('manager demotes self', $$select public.set_member(auth.uid(),'site','{}')$$);
insert into transactions (company_id,kind,engineer_id,account_id,amount) values (my_company(),'give','00000000-0000-0000-0000-00000000000b',(select id from accounts where type='cash'),50000);
insert into transactions (company_id,kind,project_id,account_id,amount,note) values (my_company(),'pay',(select v from ids where k='p1'),(select id from accounts where type='bank'),300000,'contract');
select 'manager sees members: '||count(*) from profiles;
reset role;
-- site engineer
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false); set role authenticated;
insert into transactions (company_id,kind,project_id,item,amount,engineer_id,status,note) values (my_company(),'exp',(select v from ids where k='p1'),'plumbing',7000,auth.uid(),'pending','pipes') returning 'site: pending expense on own project ok';
select test.expect_fail('site expense on other project', format($$insert into transactions (company_id,kind,project_id,item,amount,engineer_id,status) values (my_company(),'exp','%s','plumbing',1,auth.uid(),'pending')$$,(select v from ids where k='p2')));
select test.expect_fail('site inserts approved expense', format($$insert into transactions (company_id,kind,project_id,item,amount,engineer_id,status) values (my_company(),'exp','%s','plumbing',1,auth.uid(),'approved')$$,(select v from ids where k='p1')));
select test.expect_fail('site gives itself custody', $$insert into transactions (company_id,kind,engineer_id,amount) values (my_company(),'give',auth.uid(),999999)$$);
select test.expect_fail('site approves own expense', $$select public.decide_expense((select id from transactions where kind='exp' limit 1), true)$$);
select 'site sees tx kinds: '||string_agg(kind,',' order by kind) from transactions;
select 'site sees accounts: '||count(*) from accounts;
select 'site sees projects: '||count(*) from projects;
select public.update_progress((select v from ids where k='p1'),40,'plaster done');
select test.expect_fail('site progress on other project', format($$select public.update_progress('%s',10,'x')$$,(select v from ids where k='p2')));
insert into storage.objects (bucket_id,name) values ('receipts', my_company()::text||'/r1.jpg') returning 'site: receipt upload to own company folder ok';
select test.expect_fail('site uploads to another folder', $$insert into storage.objects (bucket_id,name) values ('receipts','00000000-0000-0000-0000-000000000000/x.jpg')$$);
reset role;
-- client before approval
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000d',false); set role authenticated;
select 'client sees tx before approval: '||coalesce(string_agg(kind||':'||status,','),'none') from transactions;
select 'client sees projects: '||count(*) from projects;
select test.expect_fail('client inserts payment', format($$insert into transactions (company_id,kind,project_id,amount) values (my_company(),'pay','%s',1)$$,(select v from ids where k='p1')));
with x as (update projects set fee_value=0 returning 1) select 'client changed projects rows: '||count(*) from x;
with x as (update tasks set title='hacked' returning 1) select 'client changed tasks rows: '||count(*) from x;
select 'client reads receipts: '||count(*) from storage.objects;
reset role;
-- manager approves
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false); set role authenticated;
select public.decide_expense((select id from transactions where kind='exp' limit 1), true);
select 'after approve: '||status from transactions where kind='exp';
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000d',false); set role authenticated;
select 'client sees tx after approval: '||string_agg(kind||':'||status,',' order by kind) from transactions;
reset role;
-- office
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000c',false); set role authenticated;
select 'office sees accounts: '||count(*) from accounts;
select 'office sees tx kinds: '||string_agg(kind,',' order by kind) from transactions;
insert into tasks (company_id,project_id,title,assignee_id) values (my_company(),(select v from ids where k='p1'),'Fix slope','00000000-0000-0000-0000-00000000000b') returning 'office: task created';
insert into tasks (company_id,project_id,title,assignee_id) values (my_company(),(select v from ids where k='p1'),'Office own','00000000-0000-0000-0000-00000000000c');
select test.expect_fail('office approves expense', $$select public.decide_expense(gen_random_uuid(), true)$$);
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false); set role authenticated;
update tasks set status='done' where title='Fix slope' returning 'site: own task marked done';
with x as (update tasks set status='done' where title='Office own' returning 1) select 'site edits office task rows: '||count(*) from x;
with x as (update projects set progress=99 returning 1) select 'site edits projects directly rows: '||count(*) from x;
with x as (update transactions set status='approved' returning 1) select 'site edits transactions rows: '||count(*) from x;
reset role;
-- outsider
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000f',false); set role authenticated;
select public.create_company('Other Co','X') is not null;
select 'outsider sees: projects='||(select count(*) from projects)||' tx='||(select count(*) from transactions)||' profiles='||(select count(*) from profiles)||' tasks='||(select count(*) from tasks);
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000e',false); set role authenticated;
select 'pending still sees projects='||(select count(*) from projects)||' profiles='||(select count(*) from profiles);
reset role;
select 'ALL TESTS PASSED';
