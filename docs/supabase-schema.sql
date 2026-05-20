-- FundingMatch AI Supabase/PostgreSQL schema
-- Run this in the Supabase SQL editor for a new project.
--
-- Row Level Security is enabled by default. User-owned rows are private to
-- auth.uid(); the generic EcoSmart Demo project is readable by everyone and is
-- not editable by normal authenticated users.

create table if not exists public.projects (
  id text primary key,
  name text not null,
  short_description text not null,
  country text,
  sectors jsonb not null default '[]'::jsonb,
  technologies jsonb not null default '[]'::jsonb,
  target_users jsonb not null default '[]'::jsonb,
  problem_solved text,
  solution text,
  stage text not null check (
    stage in ('idea', 'prototype', 'pilot', 'early_revenue', 'scaling')
  ),
  trl integer check (trl is null or trl between 1 and 9),
  preferred_funding_types jsonb not null default '[]'::jsonb,
  keywords jsonb not null default '[]'::jsonb,
  avoid jsonb not null default '[]'::jsonb,
  scoring_weights jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete cascade
);

alter table public.projects enable row level security;

comment on table public.projects is
  'FundingMatch AI project profiles. User-owned rows are private; ecosmart-demo is public read-only demo data.';

create index if not exists projects_updated_at_idx
  on public.projects (updated_at desc);

create index if not exists projects_user_id_idx
  on public.projects (user_id);

create index if not exists projects_stage_idx
  on public.projects (stage);

create table if not exists public.manual_funding_calls (
  id text primary key,
  title text not null,
  programme text,
  topic_id text,
  status text,
  deadline text,
  budget text,
  url text,
  description text,
  eligibility text,
  source_name text,
  source_type text,
  source_url text,
  retrieved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete cascade
);

alter table public.manual_funding_calls enable row level security;

comment on table public.manual_funding_calls is
  'FundingMatch AI manually curated funding calls. Rows are private to their owning authenticated user.';

create index if not exists manual_funding_calls_user_id_idx
  on public.manual_funding_calls (user_id);

create index if not exists manual_funding_calls_topic_id_idx
  on public.manual_funding_calls (topic_id);

create index if not exists manual_funding_calls_programme_idx
  on public.manual_funding_calls (programme);

create index if not exists manual_funding_calls_retrieved_at_idx
  on public.manual_funding_calls (retrieved_at desc);

create table if not exists public.saved_scans (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  project_name text,
  result jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.saved_scans enable row level security;

comment on table public.saved_scans is
  'FundingMatch AI saved scan reports. Rows are private to their owning authenticated user.';

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

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

drop trigger if exists manual_funding_calls_set_updated_at on public.manual_funding_calls;
create trigger manual_funding_calls_set_updated_at
before update on public.manual_funding_calls
for each row
execute function public.set_updated_at();
