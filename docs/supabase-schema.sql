-- FundingMatch AI Supabase/PostgreSQL schema
-- Run this in the Supabase SQL editor for a new project.
--
-- The application currently uses a server-only service role adapter and does
-- not expose Supabase directly to browser code. Row Level Security is enabled
-- by default below, and no anon/authenticated policies are created yet. Add
-- authentication and explicit user-scoped RLS policies before allowing
-- browser/client access.

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
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

comment on table public.projects is
  'FundingMatch AI project profiles. RLS is enabled; no public anon/authenticated policies are created by this schema.';

create index if not exists projects_updated_at_idx
  on public.projects (updated_at desc);

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
  updated_at timestamptz not null default now()
);

alter table public.manual_funding_calls enable row level security;

comment on table public.manual_funding_calls is
  'FundingMatch AI manually curated funding calls. RLS is enabled; no public anon/authenticated policies are created by this schema.';

create index if not exists manual_funding_calls_topic_id_idx
  on public.manual_funding_calls (topic_id);

create index if not exists manual_funding_calls_programme_idx
  on public.manual_funding_calls (programme);

create index if not exists manual_funding_calls_retrieved_at_idx
  on public.manual_funding_calls (retrieved_at desc);

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
