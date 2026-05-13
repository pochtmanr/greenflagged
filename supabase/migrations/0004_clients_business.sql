-- Phase 5: clients address book + business_profiles preset table.
-- Apply remotely via Supabase MCP `apply_migration` against project pwvtjuklkfelpxzxjmsi,
-- then regenerate lib/supabase/types.ts.

-- ===== clients (saved clients per user) =====
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  -- party identity
  first_name text,
  family_name text,
  business_name text,
  -- contact
  email text,
  phone text,
  -- address
  country_code text,
  city text,
  street text,
  postal_code text,
  -- meta
  notes text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clients enable row level security;

create policy "own clients" on public.clients
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create unique index clients_one_default_per_user
  on public.clients (owner_id) where is_default = true;

create index clients_owner_idx on public.clients (owner_id, created_at desc);

-- ===== business_profiles (saved "my company" presets) =====
create table public.business_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  -- legal identity
  first_name text,
  family_name text,
  business_name text,
  tax_id text,
  -- contact
  email text,
  phone text,
  website text,
  -- address
  country_code text,
  city text,
  street text,
  postal_code text,
  -- branding (Phase 6 wires logo upload to this column)
  logo_path text,
  -- meta
  is_default boolean not null default false,
  label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.business_profiles enable row level security;

create policy "own business_profiles" on public.business_profiles
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create unique index business_profiles_one_default_per_user
  on public.business_profiles (owner_id) where is_default = true;

create index business_profiles_owner_idx
  on public.business_profiles (owner_id, created_at desc);
