-- Test-run application priced before the gazetted fees were loaded: Schedule IX item 7 (Rs 200)
-- + rule 16(2) on-site half fee (Rs 100) + visit minimum (Rs 100). Applied to the live project on 2 Oct 2026.
update public.applications set data = jsonb_set(data, '{feeAmount}', '400'::jsonb)
 where id = 'APP-2026-00416' and (data->>'feeAmount')::numeric = 250;
