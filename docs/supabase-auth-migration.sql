-- FundingMatch AI Phase 11 auth/private-data migration
-- Run this on an existing Supabase database after docs/supabase-schema.sql.
--
-- Existing rows without user_id are intentionally left unowned. RLS policies
-- below hide those rows from public/authenticated users unless the row is the
-- generic public demo project ecosmart-demo with user_id null.

alter table public.projects
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.manual_funding_calls
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create table if not exists public.saved_scans (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  project_name text,
  result jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;
alter table public.manual_funding_calls enable row level security;
alter table public.saved_scans enable row level security;

create index if not exists projects_user_id_idx
  on public.projects (user_id);

create index if not exists manual_funding_calls_user_id_idx
  on public.manual_funding_calls (user_id);

create index if not exists saved_scans_user_id_idx
  on public.saved_scans (user_id);

create index if not exists saved_scans_created_at_idx
  on public.saved_scans (created_at desc);

drop policy if exists projects_public_demo_select on public.projects;
create policy projects_public_demo_select
on public.projects
for select
to anon, authenticated
using (id = 'ecosmart-demo' and user_id is null);

drop policy if exists projects_owner_select on public.projects;
create policy projects_owner_select
on public.projects
for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists projects_owner_insert on public.projects;
create policy projects_owner_insert
on public.projects
for insert
to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists projects_owner_update on public.projects;
create policy projects_owner_update
on public.projects
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists projects_owner_delete on public.projects;
create policy projects_owner_delete
on public.projects
for delete
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists manual_funding_calls_owner_select
on public.manual_funding_calls;
create policy manual_funding_calls_owner_select
on public.manual_funding_calls
for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists manual_funding_calls_owner_insert
on public.manual_funding_calls;
create policy manual_funding_calls_owner_insert
on public.manual_funding_calls
for insert
to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists manual_funding_calls_owner_update
on public.manual_funding_calls;
create policy manual_funding_calls_owner_update
on public.manual_funding_calls
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists manual_funding_calls_owner_delete
on public.manual_funding_calls;
create policy manual_funding_calls_owner_delete
on public.manual_funding_calls
for delete
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists saved_scans_owner_select on public.saved_scans;
create policy saved_scans_owner_select
on public.saved_scans
for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists saved_scans_owner_insert on public.saved_scans;
create policy saved_scans_owner_insert
on public.saved_scans
for insert
to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists saved_scans_owner_update on public.saved_scans;
create policy saved_scans_owner_update
on public.saved_scans
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists saved_scans_owner_delete on public.saved_scans;
create policy saved_scans_owner_delete
on public.saved_scans
for delete
to authenticated
using (user_id = (select auth.uid()));
