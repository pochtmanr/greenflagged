-- Phase 6: contract styles + clone source + business_profile link.
--
-- NOTE on ordering: Phase 5 (in parallel) creates `public.business_profiles`.
-- This migration uses `add column if not exists` and only adds the FK once
-- Phase 5 has merged. To keep this branch buildable in isolation we also
-- create a minimal `business_profiles` table guarded by `if not exists` so
-- both orderings work. Phase 5's canonical migration adds the additional
-- columns (first_name, family_name, address, etc.); we only depend on `id`
-- and `logo_path` here. Re-apply Phase 5's migration first when both are
-- merged so the canonical schema wins.

-- ============= business_profiles (stub if Phase 5 not yet applied) =====
create table if not exists public.business_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  business_name text,
  first_name text,
  family_name text,
  logo_path text,
  is_default boolean not null default false,
  label text,
  created_at timestamptz not null default now()
);

alter table public.business_profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'business_profiles'
      and policyname = 'own business_profiles'
  ) then
    create policy "own business_profiles" on public.business_profiles
      for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
  end if;
end $$;

-- ============= contracts: style + business + source link ===============
alter table public.contracts
  add column if not exists style jsonb not null default '{
    "typography": "editorial",
    "accent": "sage",
    "layout": "single",
    "logo_placement": "header"
  }'::jsonb,
  add column if not exists business_profile_id uuid references public.business_profiles(id) on delete set null,
  add column if not exists source_contract_id uuid references public.contracts(id) on delete set null;

-- ============= storage: extend RLS for business_profiles/{user_id}/ ====
-- The `contracts` bucket is reused for business-profile logos under a
-- separate path prefix, so user-scoped ownership is still enforced.

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'own business profile files read'
  ) then
    create policy "own business profile files read" on storage.objects
      for select using (
        bucket_id = 'contracts'
        and (storage.foldername(name))[1] = 'business_profiles'
        and (storage.foldername(name))[2] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'own business profile files insert'
  ) then
    create policy "own business profile files insert" on storage.objects
      for insert with check (
        bucket_id = 'contracts'
        and (storage.foldername(name))[1] = 'business_profiles'
        and (storage.foldername(name))[2] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'own business profile files update'
  ) then
    create policy "own business profile files update" on storage.objects
      for update using (
        bucket_id = 'contracts'
        and (storage.foldername(name))[1] = 'business_profiles'
        and (storage.foldername(name))[2] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'own business profile files delete'
  ) then
    create policy "own business profile files delete" on storage.objects
      for delete using (
        bucket_id = 'contracts'
        and (storage.foldername(name))[1] = 'business_profiles'
        and (storage.foldername(name))[2] = auth.uid()::text
      );
  end if;
end $$;
