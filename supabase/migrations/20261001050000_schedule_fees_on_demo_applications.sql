-- Demo application fees recomputed from Schedule IX and rule 16 (see scripts/check-seed-fees.ts).
begin;
update public.applications set data = jsonb_set(data, '{feeAmount}', '200'::jsonb) where id = 'APP-2026-00101';
update public.applications set data = jsonb_set(data, '{feeAmount}', '175'::jsonb) where id = 'APP-2026-00102';
update public.applications set data = jsonb_set(data, '{feeAmount}', '250'::jsonb) where id = 'APP-2026-00201';
update public.applications set data = jsonb_set(data, '{feeAmount}', '137.5'::jsonb) where id = 'APP-2026-00310';
update public.applications set data = jsonb_set(data, '{feeAmount}', '2000'::jsonb) where id = 'APP-2026-00103';
update public.applications set data = jsonb_set(data, '{feeAmount}', '850'::jsonb) where id = 'APP-2026-00415';
update public.instruments set data = data || '{"category": "PLATFORM_SCALE"}'::jsonb where id = 'LM-DL-2026-001290';
update public.certificates set data = data || '{"category": "PLATFORM_SCALE"}'::jsonb where id = 'CERT-2026-08912';
update public.notifications set data = replace(data::text, 'fee ₹1,500 is unpaid', 'fee ₹137.50 is unpaid')::jsonb where data::text like '%fee ₹1,500 is unpaid%';
commit;
