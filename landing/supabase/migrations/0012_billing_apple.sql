-- Phase 12: Apple IAP via RevenueCat
--
-- Mirrors the existing Revolut/OxaPay payment columns so the same subscriptions
-- + credits + payments tables back both web and iOS billing. A user logged in
-- on web with a Standard plan sees the same quota when they open the iOS app
-- — there is no separate "Apple plan".
--
-- Idempotency strategy: every transaction landing in the tables carries an
-- `apple_transaction_id` (one-off / per-renewal) and subscriptions also carry
-- `apple_original_transaction_id` (the Apple ID -> Supabase user binding).
-- Both have UNIQUE indexes so duplicate events from RC's webhook or the iOS
-- client are no-ops at the DB level.

-- ===== payments: extend provider check + apple_transaction_id =====
alter table public.payments drop constraint if exists payments_provider_check;
alter table public.payments add constraint payments_provider_check
  check (provider in ('revolut','oxapay','apple'));

alter table public.payments
  add column if not exists apple_transaction_id text;
create unique index if not exists payments_apple_transaction_id_idx
  on public.payments (apple_transaction_id) where apple_transaction_id is not null;

-- ===== subscriptions: provider column + Apple linkage =====
alter table public.subscriptions
  add column if not exists provider text not null default 'revolut'
    check (provider in ('revolut','oxapay','apple'));
alter table public.subscriptions
  add column if not exists apple_original_transaction_id text;
alter table public.subscriptions
  add column if not exists apple_product_id text;
create unique index if not exists subscriptions_apple_original_transaction_id_idx
  on public.subscriptions (apple_original_transaction_id)
  where apple_original_transaction_id is not null;

-- ===== credits: extend source enum + apple_transaction_id =====
alter table public.credits drop constraint if exists credits_source_check;
alter table public.credits add constraint credits_source_check
  check (source in ('payg_3usd','admin_grant','apple_payg'));

alter table public.credits
  add column if not exists apple_transaction_id text;
create unique index if not exists credits_apple_transaction_id_idx
  on public.credits (apple_transaction_id) where apple_transaction_id is not null;

-- ===== RPC: claim_apple_subscription =====
-- Called by the iOS client after every successful purchase / restore. Binds
-- the Apple originalTransactionId to the current Supabase user. Returns
-- {action: 'success'} on first claim or self-update, {action: 'rejected',
-- owner: <uuid>} when another Supabase user already owns the Apple receipt
-- (which happens when a user signs in with a different Supabase account on a
-- device that has an active Apple ID entitlement).
create or replace function public.claim_apple_subscription(
  p_original_transaction_id text,
  p_product_id text,
  p_expires_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  existing_owner uuid;
begin
  if caller is null then
    return jsonb_build_object('action', 'rejected', 'reason', 'unauthenticated');
  end if;

  select user_id into existing_owner
    from public.subscriptions
    where apple_original_transaction_id = p_original_transaction_id;

  if existing_owner is not null and existing_owner <> caller then
    return jsonb_build_object(
      'action', 'rejected',
      'reason', 'already_bound',
      'owner', existing_owner
    );
  end if;

  insert into public.subscriptions (
    user_id,
    plan,
    status,
    provider,
    apple_original_transaction_id,
    apple_product_id,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    updated_at
  ) values (
    caller,
    'standard',
    'active',
    'apple',
    p_original_transaction_id,
    p_product_id,
    now(),
    p_expires_at,
    false,
    now()
  )
  on conflict (user_id) do update set
    plan = 'standard',
    status = 'active',
    provider = 'apple',
    apple_original_transaction_id = excluded.apple_original_transaction_id,
    apple_product_id = excluded.apple_product_id,
    current_period_end = excluded.current_period_end,
    cancel_at_period_end = false,
    updated_at = now();

  return jsonb_build_object('action', 'success');
end
$$;

revoke execute on function public.claim_apple_subscription(text, text, timestamptz) from public;
grant execute on function public.claim_apple_subscription(text, text, timestamptz) to authenticated;

-- ===== RPC: claim_apple_payg =====
-- Called by the iOS client after a successful consumable purchase. Idempotent
-- on apple_transaction_id. No cross-account rejection — consumables are bound
-- to the Apple ID, not the Supabase user, so whoever is signed in pays the
-- consumable benefits into their own account.
create or replace function public.claim_apple_payg(
  p_transaction_id text,
  p_product_id text,
  p_quantity int default 1
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  qty int := greatest(coalesce(p_quantity, 1), 1);
begin
  if caller is null then
    return jsonb_build_object('action', 'rejected', 'reason', 'unauthenticated');
  end if;

  if exists (
    select 1 from public.credits where apple_transaction_id = p_transaction_id
  ) then
    return jsonb_build_object('action', 'success', 'dedup', true);
  end if;

  insert into public.credits (
    user_id,
    contracts_remaining,
    expires_at,
    source,
    apple_transaction_id
  ) values (
    caller,
    qty,
    now() + interval '90 days',
    'apple_payg',
    p_transaction_id
  );

  return jsonb_build_object('action', 'success');
end
$$;

revoke execute on function public.claim_apple_payg(text, text, int) from public;
grant execute on function public.claim_apple_payg(text, text, int) to authenticated;
