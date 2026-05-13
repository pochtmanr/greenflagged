-- Phase 4: Revolut payments + tier enforcement

-- ===== subscriptions =====
create table public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null check (plan in (
    'free',
    'freelancer_monthly',
    'freelancer_yearly',
    'pro_monthly',
    'pro_yearly'
  )),
  status text not null check (status in (
    'active',
    'trialing',
    'past_due',
    'canceled',
    'expired'
  )),
  revolut_customer_id text,
  revolut_payment_method_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "own subscription read" on public.subscriptions
  for select using (auth.uid() = user_id);

-- writes only from service-role (webhook + admin); no policies for insert/update/delete

-- Default every new profile to a free subscription.
create or replace function public.ensure_free_subscription()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.subscriptions (user_id, plan, status)
    values (new.user_id, 'free', 'active')
    on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_profile_created on public.profiles;
create trigger on_profile_created
  after insert on public.profiles for each row execute function public.ensure_free_subscription();

-- Backfill any existing profiles.
insert into public.subscriptions (user_id, plan, status)
  select user_id, 'free', 'active' from public.profiles
  on conflict (user_id) do nothing;

-- ===== credits (one-off purchases) =====
create table public.credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scans_remaining int not null default 0,
  drafts_remaining int not null default 0,
  expires_at timestamptz not null,
  source text not null check (source in ('one_off_9eur','admin_grant')),
  created_at timestamptz not null default now()
);

alter table public.credits enable row level security;

create policy "own credits read" on public.credits
  for select using (auth.uid() = user_id);

create index credits_user_expires_idx on public.credits (user_id, expires_at);

-- ===== payments (audit log) =====
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  revolut_order_id text unique,
  kind text not null check (kind in (
    'subscription_initial',
    'subscription_renewal',
    'one_off'
  )),
  plan text,
  amount_cents int not null,
  currency text not null default 'EUR',
  status text not null check (status in (
    'pending',
    'succeeded',
    'failed',
    'refunded'
  )),
  raw jsonb,
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create policy "own payments read" on public.payments
  for select using (auth.uid() = user_id);

create index payments_user_created_idx on public.payments (user_id, created_at desc);
