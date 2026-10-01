-- ---------------------------------------------------------------- model approval register (public reference data)
-- A copy of the Model Approval register published by the Department of Consumer Affairs at
-- https://lm.doca.gov.in/modelapproval/Certificates.aspx, loaded by scripts/fetch-model-approvals.mjs.
-- Every approved model carries an approval mark such as IND/09/26/456: 26 is the year and 456 the
-- certificate number in that year's register. Anyone can read it; only the loader writes it.
create table if not exists public.model_approvals (
  id bigserial primary key,
  year int not null,
  cert_no text not null default '',          -- as published, often free text in older years
  cert_from int,                             -- approval numbers this certificate covers
  cert_to int,
  issue_date date,
  file_no text,
  company text not null default '',
  equipment text not null default '',
  application_no text,
  pdf_url text not null,
  fetched_at timestamptz not null,
  unique (year, cert_no, company, equipment)
);
create index if not exists model_approvals_mark on public.model_approvals (year, cert_from, cert_to);

alter table public.model_approvals enable row level security;
drop policy if exists model_approvals_read on public.model_approvals;
create policy model_approvals_read on public.model_approvals for select using (true);

-- Looks up an approval mark. Returns every register entry it points to (some old marks point to two
-- companies because the register itself repeats a number), plus what the copy covers.
create or replace function public.lookup_model_approval(mark text)
returns jsonb language sql stable security definer set search_path = public as $$
  with m as (
    select regexp_match(upper(coalesce(mark, '')), '^\s*IND\s*/\s*(\d{1,2})\s*/\s*(\d{2}|\d{4})\s*/\s*(\d{1,4})\s*$') r
  ), p as (
    select case when length(r[2]) = 2 then 2000 + r[2]::int else r[2]::int end as y, r[3]::int as n from m where r is not null
  )
  select jsonb_build_object(
    'parsed', exists (select 1 from p),
    'year', (select y from p),
    'number', (select n from p),
    'matches', coalesce((
      select jsonb_agg(jsonb_build_object(
        'company', a.company, 'equipment', a.equipment, 'issueDate', a.issue_date,
        'certNo', a.cert_no, 'fileNo', a.file_no, 'pdf', a.pdf_url) order by a.issue_date)
      from public.model_approvals a, p
      where a.year = p.y and p.n between a.cert_from and a.cert_to), '[]'::jsonb),
    'yearCovered', exists (select 1 from public.model_approvals a, p where a.year = p.y),
    'coverage', (select jsonb_build_object('from', min(year), 'to', max(year), 'entries', count(*), 'fetchedAt', max(fetched_at)) from public.model_approvals)
  )
$$;
grant execute on function public.lookup_model_approval(text) to anon, authenticated;
