-- FundingMatch AI public demo seed
-- Run after docs/supabase-schema.sql when you want the generic public demo
-- project available in Supabase-backed deployments.

insert into public.projects (
  id,
  name,
  short_description,
  country,
  sectors,
  technologies,
  target_users,
  problem_solved,
  solution,
  stage,
  trl,
  preferred_funding_types,
  keywords,
  avoid,
  scoring_weights,
  created_at,
  updated_at,
  user_id
)
values (
  'ecosmart-demo',
  'EcoSmart Demo',
  'A generic example project using AI, sensors, and data analytics to monitor environmental conditions and identify suitable sustainability funding opportunities.',
  'Belgium',
  '["sustainability", "environment", "digital innovation", "monitoring technology"]'::jsonb,
  '["AI", "sensors", "data analytics"]'::jsonb,
  'Sustainability teams, public organisations, facility operators, and innovation managers.',
  'Organisations need accessible environmental monitoring data to plan sustainability projects and identify relevant funding routes.',
  'EcoSmart Demo combines sensor readings, AI-assisted analysis, and simple reporting workflows to highlight environmental trends and funding-ready pilot opportunities.',
  'prototype',
  5,
  '["grant", "pilot", "accelerator"]'::jsonb,
  '["sustainability", "environmental monitoring", "AI", "sensors", "digital innovation", "climate", "data analytics"]'::jsonb,
  '["defence-only calls", "pure equity"]'::jsonb,
  '{"topicFit": 4, "eligibilityFit": 3, "fundingFit": 3, "stageFit": 2, "deadlineFit": 2, "competitionRisk": 1, "strategicValue": 3}'::jsonb,
  now(),
  now(),
  null
)
on conflict (id) do update
set
  name = excluded.name,
  short_description = excluded.short_description,
  country = excluded.country,
  sectors = excluded.sectors,
  technologies = excluded.technologies,
  target_users = excluded.target_users,
  problem_solved = excluded.problem_solved,
  solution = excluded.solution,
  stage = excluded.stage,
  trl = excluded.trl,
  preferred_funding_types = excluded.preferred_funding_types,
  keywords = excluded.keywords,
  avoid = excluded.avoid,
  scoring_weights = excluded.scoring_weights,
  user_id = null,
  updated_at = now();
