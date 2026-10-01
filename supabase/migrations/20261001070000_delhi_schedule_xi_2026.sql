-- Delhi replaced Schedule XI (compounding fees) by the Delhi Legal Metrology (Enforcement) Amendment Rules, 2026,
-- Delhi Gazette 28 Jan 2026. Item 11 (unverified weight or measure, section 33) is now Rs 10,000 (was 5,000).
-- Contravention of any rule (section 53(3)) is now item 17 at Rs 5,000 (was item 16 at Rs 500).
-- The demo case ENF-2026-0015 was compounded in Aug 2026, so the new schedule applies to it.
begin;
update public.enforcement_cases
   set data = (replace(data::text, 'Compounding fee ₹5,000 collected (Delhi Schedule XI, item 11)', 'Compounding fee ₹10,000 collected (Delhi Schedule XI, item 11)')::jsonb) || '{"penaltyAmount": 10000}'::jsonb
 where id = 'ENF-2026-0015';
update public.audit_logs
   set data = replace(data::text, '₹5,000 collected under Delhi Schedule XI, item 11.', '₹10,000 collected under Delhi Schedule XI, item 11.')::jsonb
 where data::text like '%₹5,000 collected under Delhi Schedule XI, item 11.%';
-- Cases booked through the app before this change carry the old prefilled amounts.
update public.enforcement_cases set data = data || '{"penaltyAmount": 10000}'::jsonb
 where state = 'Delhi' and (data->>'penaltyAmount')::numeric = 5000
   and data->>'offenseCategory' in ('UNVERIFIED_USE', 'TAMPERED_SEAL', 'EXCEEDED_MPE_ERROR') and data->>'status' <> 'COMPOUNDED';
update public.enforcement_cases set data = data || '{"penaltyAmount": 5000}'::jsonb
 where state = 'Delhi' and (data->>'penaltyAmount')::numeric = 500
   and data->>'offenseCategory' = 'NON_DISPLAY_OF_CERTIFICATE' and data->>'status' <> 'COMPOUNDED';
commit;
