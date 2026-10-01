-- 1. Real listed companies no longer appear in demo records (never in signed certificate fields).
-- 2. Demo enforcement cases use Delhi Schedule XI compounding fees; no invented amounts for States whose
--    schedule is not loaded. 3. Counter machine and beam scale due dates follow rule 27 (24 months).
begin;
update public.instruments set data = replace(replace(replace(data::text, 'Gujarat Gas Limited', 'Sabarmati City Gas (demo)'), 'Gujarat Gas Ltd', 'Sabarmati City Gas (demo)'), 'UltraTech Cement Ltd, Amreli Works', 'Amreli Cement Works (demo)')::jsonb where data::text ~ '(Gujarat Gas|UltraTech)';
update public.instruments set data = replace(data::text, 'UltraTech Cement Ltd', 'Amreli Cement Works (demo)')::jsonb where data::text like '%UltraTech%';
update public.applications set data = replace(replace(replace(data::text, 'Gujarat Gas Limited', 'Sabarmati City Gas (demo)'), 'Gujarat Gas Ltd', 'Sabarmati City Gas (demo)'), 'Gujarat Gas', 'Sabarmati City Gas')::jsonb where data::text like '%Gujarat Gas%';
update public.applications set data = replace(data::text, 'UltraTech Cement Ltd', 'Amreli Cement Works (demo)')::jsonb where data::text like '%UltraTech%';
update public.enforcement_cases set data = replace(replace(data::text, 'Gujarat Gas Limited', 'Sabarmati City Gas (demo)'), 'Gujarat Gas Ltd', 'Sabarmati City Gas (demo)')::jsonb where data::text like '%Gujarat Gas%';
update public.audit_logs set data = replace(replace(data::text, 'Gujarat Gas Ltd', 'Sabarmati City Gas'), 'Gujarat Gas', 'Sabarmati City Gas')::jsonb where data::text like '%Gujarat Gas%';
update public.audit_logs set data = replace(data::text, 'UltraTech Cement Ltd', 'Amreli Cement Works (demo)')::jsonb where data::text like '%UltraTech%';
update public.notifications set data = replace(replace(replace(data::text, '📋 New Application — Gujarat Gas', 'New application: Sabarmati City Gas'), 'Gujarat Gas Ltd', 'Sabarmati City Gas'), 'Gujarat Gas', 'Sabarmati City Gas')::jsonb where data::text like '%Gujarat Gas%';
update public.outbox set data = replace(replace(data::text, 'Gujarat Gas Ltd', 'Sabarmati City Gas'), 'Gujarat Gas', 'Sabarmati City Gas')::jsonb where data::text like '%Gujarat Gas%';
update public.outbox set data = replace(data::text, 'UltraTech Cement Ltd', 'Amreli Cement Works (demo)')::jsonb where data::text like '%UltraTech%';

update public.enforcement_cases set data = data - 'penaltyAmount' where id in ('ENF-2026-0031', 'ENF-2026-0042');
update public.enforcement_cases set data = data || '{"penaltyAmount": 5000, "actSection": "Section 24 read with section 33, Legal Metrology Act, 2009"}'::jsonb where id = 'ENF-2026-0015';
update public.enforcement_cases set data = data || '{"actSection": "Section 24 read with section 33, Legal Metrology Act, 2009"}'::jsonb where id = 'ENF-2026-0019';

update public.instruments set data = data || '{"nextVerificationDueDate": "2027-06-30"}'::jsonb where id = 'LM-DL-2026-003102' and data->>'lastVerificationDate' = '2025-07-01';
update public.instruments set data = data || '{"nextVerificationDueDate": "2027-08-09"}'::jsonb where id = 'LM-DL-2026-002891' and data->>'lastVerificationDate' = '2025-08-10';
commit;
