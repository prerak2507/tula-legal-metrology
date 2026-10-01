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
-- Old compounding amounts quoted in demo text.
update public.enforcement_cases set data = replace(data::text, 'Compounding fee ₹15,000 collected; Instrument recalibrated and re-verified.', 'Compounding fee ₹5,000 collected (Delhi Schedule XI, item 11); instrument recalibrated and re-verified.')::jsonb where data::text like '%₹15,000%';
update public.audit_logs set data = replace(data::text, 'Compounding completed for Quick Petrol, ₹15,000 collected.', 'Compounding completed for Quick Petrol, ₹5,000 collected under Delhi Schedule XI, item 11.')::jsonb where data::text like '%₹15,000%';
update public.notifications set data = replace(data::text, 'Compounding penalty ₹10,000.', 'Compounding fee to be fixed under the Maharashtra Schedule XI.')::jsonb where data::text like '%₹10,000%';
commit;
