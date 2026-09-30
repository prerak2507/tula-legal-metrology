-- TULA live schema (SIH 26036)
-- Every record lives here. Key columns drive row-level security; `data` holds the full record
-- exactly as the app uses it. Illegal changes are blocked by RLS and triggers, not by the UI.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- profiles & identity
create table if not exists public.profiles (
  id text primary key,                                   -- app user id, e.g. usr-bus-1 or usr-<uuid>
  auth_id uuid unique references auth.users(id) on delete set null,
  email text unique not null,
  role text not null check (role in ('BUSINESS','LMO','GATC','CONTROLLER','STATE_ADMIN','CENTRAL_ADMIN')),
  state text not null,
  district text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seeded officer accounts are linked to their auth user by email.
create table if not exists public.demo_accounts (
  email text primary key,
  profile_id text not null references public.profiles(id)
);

create or replace function public.app_uid() returns text language sql stable security definer set search_path = public as
$$ select id from public.profiles where auth_id = auth.uid() $$;
create or replace function public.app_role() returns text language sql stable security definer set search_path = public as
$$ select role from public.profiles where auth_id = auth.uid() $$;
create or replace function public.app_state() returns text language sql stable security definer set search_path = public as
$$ select state from public.profiles where auth_id = auth.uid() $$;
create or replace function public.is_officer() returns boolean language sql stable security definer set search_path = public as
$$ select coalesce(public.app_role() in ('LMO','GATC','CONTROLLER','STATE_ADMIN','CENTRAL_ADMIN'), false) $$;
create or replace function public.in_jurisdiction(st text) returns boolean language sql stable security definer set search_path = public as
$$ select coalesce(public.app_role() = 'CENTRAL_ADMIN' or (public.is_officer() and public.app_state() = st), false) $$;
create or replace function public.state_code(st text) returns text language sql immutable as
$$ select case st when 'Delhi' then 'DL' when 'Gujarat' then 'GJ' when 'Maharashtra' then 'MH' when 'Karnataka' then 'KA'
  when 'Tamil Nadu' then 'TN' when 'Rajasthan' then 'RJ' when 'Uttar Pradesh' then 'UP' else 'IN' end $$;

-- New auth user: link to a seeded officer profile, or create a BUSINESS profile from sign-up metadata.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare demo_profile text; meta jsonb; pid text;
begin
  select profile_id into demo_profile from public.demo_accounts where lower(email) = lower(new.email);
  if demo_profile is not null then
    update public.profiles set auth_id = new.id where id = demo_profile;
    return new;
  end if;
  meta := coalesce(new.raw_user_meta_data -> 'profile', '{}'::jsonb);
  pid := 'usr-' || replace(new.id::text, '-', '');
  insert into public.profiles (id, auth_id, email, role, state, district, data)
  values (
    pid, new.id, lower(new.email), 'BUSINESS',
    coalesce(nullif(meta->>'state',''), 'Delhi'), coalesce(nullif(meta->>'district',''), 'Central Delhi'),
    meta || jsonb_build_object('id', pid, 'email', lower(new.email), 'role', 'BUSINESS', 'accountType', 'SELF',
      'state', coalesce(nullif(meta->>'state',''), 'Delhi'), 'district', coalesce(nullif(meta->>'district',''), 'Central Delhi'),
      'createdAt', now())
  ) on conflict (email) do update set auth_id = excluded.auth_id;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- record tables
create table if not exists public.instruments (
  id text primary key, state text not null, district text not null, owner_id text not null,
  data jsonb not null, updated_at timestamptz not null default now(), updated_by text
);
create table if not exists public.applications (
  id text primary key, state text not null, district text not null, applicant_id text not null,
  assigned_to_id text, instrument_id text not null, status text not null,
  data jsonb not null, updated_at timestamptz not null default now(), updated_by text
);
create table if not exists public.inspections (
  id text primary key, application_id text not null, instrument_id text not null, inspector_id text not null, state text not null,
  data jsonb not null, updated_at timestamptz not null default now(), updated_by text
);
create table if not exists public.stampings (
  id text primary key, instrument_id text not null, state text not null,
  data jsonb not null, updated_at timestamptz not null default now(), updated_by text
);
create table if not exists public.certificates (
  id text primary key, cert_no text unique not null, instrument_id text not null, state text not null, status text not null,
  data jsonb not null, updated_at timestamptz not null default now(), updated_by text
);
create table if not exists public.enforcement_cases (
  id text primary key, instrument_id text, state text not null,
  data jsonb not null, updated_at timestamptz not null default now(), updated_by text
);
create table if not exists public.audit_logs (
  id text primary key, actor_id text not null, entity_id text, state text,
  data jsonb not null, created_at timestamptz not null default now()
);
create table if not exists public.notifications (
  id text primary key, recipient_id text not null, recipient_role text,
  data jsonb not null, updated_at timestamptz not null default now()
);
create table if not exists public.outbox (
  id text primary key, recipient_id text not null,
  data jsonb not null, updated_at timestamptz not null default now()
);
create table if not exists public.fee_rules (
  id text primary key, jurisdiction text not null,
  data jsonb not null, updated_at timestamptz not null default now(), updated_by text
);
create table if not exists public.validity_rules (
  id text primary key,
  data jsonb not null, updated_at timestamptz not null default now(), updated_by text
);
create table if not exists public.id_counters (prefix text primary key, last bigint not null default 0);

create index if not exists applications_state_idx on public.applications(state);
create index if not exists applications_applicant_idx on public.applications(applicant_id);
create index if not exists instruments_owner_idx on public.instruments(owner_id);
create index if not exists certificates_instrument_idx on public.certificates(instrument_id);
create index if not exists audit_entity_idx on public.audit_logs(entity_id);

-- Stamp who changed what and when.
create or replace function public.touch() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if to_jsonb(new) ? 'updated_by' then new.updated_by := coalesce(public.app_uid(), 'system'); end if;
  return new;
end $$;
do $$ declare t text; begin
  foreach t in array array['instruments','applications','inspections','stampings','certificates','enforcement_cases','notifications','outbox','fee_rules','validity_rules'] loop
    execute format('drop trigger if exists touch_%1$s on public.%1$s; create trigger touch_%1$s before insert or update on public.%1$s for each row execute function public.touch();', t);
  end loop;
end $$;

-- Owners cannot move their own records into officer-only states.
create or replace function public.guard_application() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_officer() or auth.uid() is null then return new; end if;
  if new.assigned_to_id is distinct from old.assigned_to_id then raise exception 'Only an officer can assign'; end if;
  if new.status <> old.status and new.status not in ('SUBMITTED','UNDER_SCRUTINY','FEE_PENDING','ASSIGNMENT_PENDING','CANCELLED') then
    raise exception 'Status % can only be set by an officer', new.status;
  end if;
  if (new.data->'scrutinyItems') is distinct from (old.data->'scrutinyItems')
     and exists (select 1 from jsonb_array_elements(new.data->'scrutinyItems') e where e->>'passed' = 'true'
       and not exists (select 1 from jsonb_array_elements(old.data->'scrutinyItems') o where o->>'id' = e->>'id' and o->>'passed' = 'true')) then
    raise exception 'Only an officer can clear scrutiny items';
  end if;
  return new;
end $$;
drop trigger if exists guard_application on public.applications;
create trigger guard_application before update on public.applications for each row execute function public.guard_application();

create or replace function public.guard_instrument() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_officer() or auth.uid() is null then return new; end if;
  if (new.data->>'status') is distinct from (old.data->>'status') and (new.data->>'status') not in ('REGISTERED','UNDER_VERIFICATION') then
    raise exception 'Only an officer can set instrument status %', new.data->>'status';
  end if;
  if (new.data->>'nextVerificationDueDate') is distinct from (old.data->>'nextVerificationDueDate') then
    raise exception 'Only an officer can change the validity date';
  end if;
  return new;
end $$;
drop trigger if exists guard_instrument on public.instruments;
create trigger guard_instrument before update on public.instruments for each row execute function public.guard_instrument();

-- ---------------------------------------------------------------- row level security
alter table public.profiles enable row level security;
alter table public.demo_accounts enable row level security;
alter table public.instruments enable row level security;
alter table public.applications enable row level security;
alter table public.inspections enable row level security;
alter table public.stampings enable row level security;
alter table public.certificates enable row level security;
alter table public.enforcement_cases enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.outbox enable row level security;
alter table public.fee_rules enable row level security;
alter table public.validity_rules enable row level security;
alter table public.id_counters enable row level security;

create or replace function public.owns_instrument(inst text) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.instruments i where i.id = inst and i.owner_id = public.app_uid()) $$;

drop policy if exists p_profiles_sel on public.profiles;
create policy p_profiles_sel on public.profiles for select to authenticated using (id = public.app_uid() or public.is_officer());

drop policy if exists p_inst_sel on public.instruments;
create policy p_inst_sel on public.instruments for select to authenticated using (owner_id = public.app_uid() or public.in_jurisdiction(state));
drop policy if exists p_inst_ins on public.instruments;
create policy p_inst_ins on public.instruments for insert to authenticated with check (owner_id = public.app_uid() and public.app_role() = 'BUSINESS');
drop policy if exists p_inst_upd on public.instruments;
create policy p_inst_upd on public.instruments for update to authenticated using (owner_id = public.app_uid() or public.in_jurisdiction(state));

drop policy if exists p_app_sel on public.applications;
create policy p_app_sel on public.applications for select to authenticated using (applicant_id = public.app_uid() or assigned_to_id = public.app_uid() or public.in_jurisdiction(state));
drop policy if exists p_app_ins on public.applications;
create policy p_app_ins on public.applications for insert to authenticated with check (applicant_id = public.app_uid() and public.owns_instrument(instrument_id) and status = 'SUBMITTED');
drop policy if exists p_app_upd on public.applications;
create policy p_app_upd on public.applications for update to authenticated using (applicant_id = public.app_uid() or assigned_to_id = public.app_uid() or public.in_jurisdiction(state));

drop policy if exists p_insp_sel on public.inspections;
create policy p_insp_sel on public.inspections for select to authenticated using (inspector_id = public.app_uid() or public.in_jurisdiction(state) or public.owns_instrument(instrument_id));
drop policy if exists p_insp_ins on public.inspections;
create policy p_insp_ins on public.inspections for insert to authenticated with check (
  inspector_id = public.app_uid() and exists (select 1 from public.applications a where a.id = application_id and a.assigned_to_id = public.app_uid()));
drop policy if exists p_insp_upd on public.inspections;
create policy p_insp_upd on public.inspections for update to authenticated using (inspector_id = public.app_uid());

drop policy if exists p_stamp_sel on public.stampings;
create policy p_stamp_sel on public.stampings for select to authenticated using (public.in_jurisdiction(state) or public.owns_instrument(instrument_id));
drop policy if exists p_stamp_ins on public.stampings;
create policy p_stamp_ins on public.stampings for insert to authenticated with check (public.app_role() in ('LMO','GATC') and public.in_jurisdiction(state));

drop policy if exists p_cert_sel on public.certificates;
create policy p_cert_sel on public.certificates for select to authenticated using (public.in_jurisdiction(state) or public.owns_instrument(instrument_id));
drop policy if exists p_cert_ins on public.certificates;
create policy p_cert_ins on public.certificates for insert to authenticated with check (public.app_role() in ('LMO','GATC') and public.in_jurisdiction(state));
drop policy if exists p_cert_upd on public.certificates;
create policy p_cert_upd on public.certificates for update to authenticated using (public.in_jurisdiction(state));

drop policy if exists p_enf_sel on public.enforcement_cases;
create policy p_enf_sel on public.enforcement_cases for select to authenticated using (public.in_jurisdiction(state) or public.owns_instrument(instrument_id));
drop policy if exists p_enf_ins on public.enforcement_cases;
create policy p_enf_ins on public.enforcement_cases for insert to authenticated with check (public.in_jurisdiction(state));
drop policy if exists p_enf_upd on public.enforcement_cases;
create policy p_enf_upd on public.enforcement_cases for update to authenticated using (public.in_jurisdiction(state));

-- Audit log is append-only: no update or delete policy exists.
drop policy if exists p_audit_sel on public.audit_logs;
create policy p_audit_sel on public.audit_logs for select to authenticated using (
  actor_id = public.app_uid() or public.in_jurisdiction(state) or public.owns_instrument(entity_id)
  or exists (select 1 from public.applications a where a.id = entity_id and a.applicant_id = public.app_uid()));
drop policy if exists p_audit_ins on public.audit_logs;
create policy p_audit_ins on public.audit_logs for insert to authenticated with check (actor_id = public.app_uid());

drop policy if exists p_notif_sel on public.notifications;
create policy p_notif_sel on public.notifications for select to authenticated using (recipient_id = public.app_uid() or (recipient_role = public.app_role() and recipient_id not like 'usr-%'));
drop policy if exists p_notif_ins on public.notifications;
create policy p_notif_ins on public.notifications for insert to authenticated with check (true);
drop policy if exists p_notif_upd on public.notifications;
create policy p_notif_upd on public.notifications for update to authenticated using (recipient_id = public.app_uid());

drop policy if exists p_outbox_sel on public.outbox;
create policy p_outbox_sel on public.outbox for select to authenticated using (recipient_id = public.app_uid() or public.is_officer());
drop policy if exists p_outbox_ins on public.outbox;
create policy p_outbox_ins on public.outbox for insert to authenticated with check (true);
drop policy if exists p_outbox_upd on public.outbox;
create policy p_outbox_upd on public.outbox for update to authenticated using (recipient_id = public.app_uid() or public.is_officer());

drop policy if exists p_fee_sel on public.fee_rules;
create policy p_fee_sel on public.fee_rules for select to anon, authenticated using (true);
drop policy if exists p_fee_write on public.fee_rules;
create policy p_fee_write on public.fee_rules for all to authenticated
  using (public.app_role() = 'CENTRAL_ADMIN' or (public.app_role() in ('STATE_ADMIN','CONTROLLER') and jurisdiction = public.state_code(public.app_state())))
  with check (public.app_role() = 'CENTRAL_ADMIN' or (public.app_role() in ('STATE_ADMIN','CONTROLLER') and jurisdiction = public.state_code(public.app_state())));

drop policy if exists p_val_sel on public.validity_rules;
create policy p_val_sel on public.validity_rules for select to anon, authenticated using (true);
drop policy if exists p_val_write on public.validity_rules;
create policy p_val_write on public.validity_rules for all to authenticated
  using (public.app_role() in ('CENTRAL_ADMIN','STATE_ADMIN')) with check (public.app_role() in ('CENTRAL_ADMIN','STATE_ADMIN'));

-- ---------------------------------------------------------------- functions for the app
-- Collision-free sequential numbers across all devices.
create or replace function public.next_serial(p_prefix text) returns bigint language plpgsql security definer set search_path = public as $$
declare v bigint;
begin
  if auth.uid() is null then raise exception 'sign in required'; end if;
  insert into public.id_counters(prefix, last) values (p_prefix, 1)
  on conflict (prefix) do update set last = public.id_counters.last + 1 returning last into v;
  return v;
end $$;

-- Public certificate check (no login). Returns only what a buyer needs.
create or replace function public.public_certificate(term text) returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', c.id, 'certificateNumber', c.cert_no, 'status', c.status,
    'instrumentType', c.data->>'instrumentType', 'organization', c.data->>'organization', 'validUntil', c.data->>'validUntil',
    'verificationDate', c.data->>'verificationDate', 'serialNumber', c.data->>'serialNumber', 'state', c.state,
    'signatureStatus', c.data->>'signatureStatus', 'signedPayload', c.data->>'signedPayload', 'signature', c.data->>'signature',
    'revocationReason', c.data->>'revocationReason', 'revokedAt', c.data->>'revokedAt')
  from public.certificates c where upper(c.id) = upper(trim(term)) or upper(c.cert_no) = upper(trim(term)) limit 1
$$;

create or replace function public.public_revocations() returns table(id text, n text, reason text, at text) language sql stable security definer set search_path = public as $$
  select c.id, c.cert_no, coalesce(c.data->>'revocationReason','Revoked by the issuing office'), left(coalesce(c.data->>'revokedAt',''),10)
  from public.certificates c where c.status = 'REVOKED'
$$;

create or replace function public.created_at_guard(d jsonb) returns timestamptz language sql stable as $$ select coalesce((d->>'createdAt')::timestamptz, 'epoch'::timestamptz) $$;
create or replace function public.next_public_serial() returns bigint language plpgsql security definer set search_path = public as $$
declare v bigint; begin
  insert into public.id_counters(prefix, last) values ('ENF-PUBLIC', 1) on conflict (prefix) do update set last = public.id_counters.last + 1 returning last into v;
  return v;
end $$;

-- Citizen complaint from the public check page. Always opens as UNDER_REVIEW with no penalty.
create or replace function public.report_problem(p jsonb) returns text language plpgsql security definer set search_path = public as $$
declare new_id text; st text; recent int;
begin
  select count(*) into recent from public.enforcement_cases where public.created_at_guard(data) > now() - interval '1 minute';
  if recent > 20 then raise exception 'Too many reports right now. Try again in a minute.'; end if;
  if length(coalesce(p->>'details','')) < 10 then raise exception 'Describe the problem'; end if;
  st := coalesce(nullif(p->>'state',''), 'Delhi');
  new_id := 'ENF-' || to_char(now(),'YYYY') || '-P' || lpad(public.next_public_serial()::text, 4, '0');
  insert into public.enforcement_cases(id, instrument_id, state, data) values (new_id, nullif(p->>'instrumentId',''), st, jsonb_build_object(
    'id', new_id, 'instrumentId', coalesce(nullif(p->>'instrumentId',''),'Not identified'), 'businessName', left(coalesce(p->>'businessName','Not given'),120),
    'violatorName', left(coalesce(p->>'violatorName','Not known'),80), 'location', left(coalesce(p->>'location',''),200),
    'district', left(coalesce(p->>'district','Not given'),60), 'state', st, 'offenseCategory', coalesce(p->>'offenseCategory','EXCEEDED_MPE_ERROR'),
    'actSection', 'To be decided by the inspecting officer', 'officerId', 'unassigned', 'officerName', 'District office (to assign)',
    'status', 'UNDER_REVIEW', 'actionTaken', 'Citizen report received through the public check page. Awaiting spot check.',
    'evidenceNotes', left(coalesce(p->>'details',''),600), 'createdAt', now()));
  return new_id;
end $$;
revoke all on function public.next_serial(text) from public, anon;
grant execute on function public.next_serial(text) to authenticated;
grant execute on function public.public_certificate(text) to anon, authenticated;
grant execute on function public.public_revocations() to anon, authenticated;
grant execute on function public.report_problem(jsonb) to anon, authenticated;

-- ---------------------------------------------------------------- realtime (live updates across devices)
do $$ declare t text; begin
  foreach t in array array['instruments','applications','inspections','stampings','certificates','enforcement_cases','audit_logs','notifications','outbox','fee_rules','validity_rules'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
