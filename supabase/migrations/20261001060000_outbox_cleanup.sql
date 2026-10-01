-- Queued SMS / email messages (none delivered: gateways not set up) brought in line with the new templates.
-- 1. Duplicate expiry reminders: the reminder record was per browser, so several devices queued the same one.
--    Keep the first for each instrument and due date. 2. Certificate messages carried the full signed QR
--    payload; they now carry the short check link. 3. Old phone numbers that could belong to real people go.
begin;

delete from public.outbox o
using public.outbox k
where o.data->>'template' = 'EXPIRY_REMINDER' and k.data->>'template' = 'EXPIRY_REMINDER'
  and o.data->'params'->>'instrumentId' = k.data->'params'->>'instrumentId'
  and o.data->'params'->>'dueDate' = k.data->'params'->>'dueDate'
  and (o.data->>'createdAt', o.id) > (k.data->>'createdAt', k.id)
  and coalesce(o.data->>'smsStatus', '') <> 'sent' and coalesce(o.data->>'emailStatus', '') <> 'sent';

update public.outbox set data = jsonb_set(jsonb_set(jsonb_set(data,
    '{params,link}', to_jsonb('https://tula-legal-metrology.vercel.app/verify/' || replace(data->'params'->>'certNo', '/', '%2F'))),
    '{subject}', to_jsonb('Certificate ' || (data->'params'->>'certNo') || ' issued')),
    '{text}', to_jsonb('TULA: Certificate ' || (data->'params'->>'certNo') || ' issued for ' || (data->'params'->>'instrumentId')
      || ', valid until ' || to_char((data->'params'->>'validUntil')::date, 'FMDD Mon YYYY')
      || '. Display it at the premises. Check: https://tula-legal-metrology.vercel.app/verify/' || replace(data->'params'->>'certNo', '/', '%2F')))
where data->>'template' = 'CERTIFICATE_ISSUED' and data->'params'->>'certNo' is not null
  and coalesce(data->>'smsStatus', '') <> 'sent' and coalesce(data->>'emailStatus', '') <> 'sent';

update public.outbox set data = jsonb_set(jsonb_set(data,
    '{subject}', to_jsonb(case when (data->'params'->>'dueDate')::date < (data->>'createdAt')::date
      then 'Verification expired: ' else 'Re-verification due: ' end || (data->'params'->>'instrumentId'))),
    '{text}', to_jsonb(case when (data->'params'->>'dueDate')::date < (data->>'createdAt')::date
      then 'TULA: Verification of ' || (data->'params'->>'instrumentId') || ' expired on ' || to_char((data->'params'->>'dueDate')::date, 'FMDD Mon YYYY')
        || '. Using it for trade is an offence under section 24, Legal Metrology Act. Apply: ' || (data->'params'->>'link')
      else 'TULA: Verification of ' || (data->'params'->>'instrumentId') || ' is due on ' || to_char((data->'params'->>'dueDate')::date, 'FMDD Mon YYYY')
        || ', in ' || (data->'params'->>'days') || ' days. Apply: ' || (data->'params'->>'link') end))
where data->>'template' = 'EXPIRY_REMINDER' and data->'params'->>'dueDate' is not null
  and coalesce(data->>'smsStatus', '') <> 'sent' and coalesce(data->>'emailStatus', '') <> 'sent';

update public.outbox set data = (data - 'phone') || '{"smsStatus": "skipped"}'::jsonb
where data->>'phone' in ('+919810123456', '+919871234567', '+919428012345', '+919910088776', '+919712345678', '+919811100223');

commit;
