-- Public check page: show the government's model approval record next to a certificate, and look up a
-- scanned DoCA certificate link. Both return only what is printed on a nameplate or published by DoCA.
create or replace function public.public_certificate_approval(term text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('mark', i.data->>'modelApprovalNumber', 'manufacturer', i.data->>'manufacturer')
  from public.certificates c join public.instruments i on i.id = c.instrument_id
  where upper(c.id) = upper(trim(term)) or upper(c.cert_no) = upper(trim(term))
  limit 1
$$;
grant execute on function public.public_certificate_approval(text) to anon, authenticated;

-- A DoCA certificate URL, as printed in a QR or pasted, mapped back to its approval mark.
create or replace function public.model_approval_by_pdf(url text)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('year', a.year, 'number', a.cert_from) order by a.cert_from), '[]'::jsonb)
  from public.model_approvals a
  where lower(a.pdf_url) = lower(trim(url)) and a.cert_from is not null
$$;
grant execute on function public.model_approval_by_pdf(text) to anon, authenticated;
