-- Add industries (multi-select) to profiles.
-- Captured during onboarding so we can tailor templates, redlines, and
-- jurisdiction hints to the kinds of work each user does.
alter table public.profiles
  add column if not exists industries text[] not null default '{}';
