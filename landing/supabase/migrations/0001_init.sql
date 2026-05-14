-- Reset prior landing schema
drop schema if exists public cascade;
create schema public;
grant usage on schema public to anon, authenticated, service_role;

-- Restore Supabase default table-level privileges (drop schema wipes them).
-- RLS still gates which rows each role can see; this just lets the role reach the table.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

-- ===== profiles =====
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  account_type text check (account_type in ('solo','freelancer','business')),
  country_code text,
  business_name text,
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "own profile read" on public.profiles
  for select using (auth.uid() = user_id);
create policy "own profile insert" on public.profiles
  for insert with check (auth.uid() = user_id);
create policy "own profile update" on public.profiles
  for update using (auth.uid() = user_id);

-- auto-create profile row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id) values (new.id)
    on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- ===== contracts =====
create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('scanned','drafted')),
  industry text check (industry in ('freelance','software','design','nda') or industry is null),
  title text,
  storage_path text,
  verdict_severity text check (verdict_severity in ('green','yellow','orange','red') or verdict_severity is null),
  created_at timestamptz not null default now(),
  retention_until timestamptz
);

alter table public.contracts enable row level security;

create policy "own contracts" on public.contracts
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create index contracts_owner_created_idx on public.contracts (owner_id, created_at desc);

-- ===== contract_versions =====
create table public.contract_versions (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  version int not null,
  body_md text,
  pdf_path text,
  created_at timestamptz not null default now(),
  unique (contract_id, version)
);

alter table public.contract_versions enable row level security;

create policy "own contract_versions" on public.contract_versions
  for all
  using (exists (select 1 from public.contracts c where c.id = contract_id and c.owner_id = auth.uid()))
  with check (exists (select 1 from public.contracts c where c.id = contract_id and c.owner_id = auth.uid()));

-- ===== scans =====
create table public.scans (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  taxonomy jsonb,
  verdict_md text,
  redlines jsonb,
  created_at timestamptz not null default now()
);

alter table public.scans enable row level security;

create policy "own scans" on public.scans
  for all
  using (exists (select 1 from public.contracts c where c.id = contract_id and c.owner_id = auth.uid()))
  with check (exists (select 1 from public.contracts c where c.id = contract_id and c.owner_id = auth.uid()));

-- ===== usage_events =====
create table public.usage_events (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('scan','draft')),
  contract_id uuid references public.contracts(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.usage_events enable row level security;

create policy "own usage_events read" on public.usage_events
  for select using (auth.uid() = user_id);
create policy "own usage_events insert" on public.usage_events
  for insert with check (auth.uid() = user_id);

create index usage_events_user_created_idx on public.usage_events (user_id, created_at desc);

-- ===== storage bucket: contracts =====
insert into storage.buckets (id, name, public) values ('contracts', 'contracts', false)
  on conflict (id) do nothing;

create policy "own contract files read" on storage.objects
  for select using (bucket_id = 'contracts' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "own contract files insert" on storage.objects
  for insert with check (bucket_id = 'contracts' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "own contract files delete" on storage.objects
  for delete using (bucket_id = 'contracts' and auth.uid()::text = (storage.foldername(name))[1]);

-- Belt-and-suspenders: grant on all already-created objects (in case default
-- privileges weren't applied — e.g. when re-running parts of this migration).
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;
