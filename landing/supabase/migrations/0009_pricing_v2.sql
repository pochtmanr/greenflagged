-- Phase 11: pricing v2 — Free / PAYG / Standard in USD, unified contracts meter

-- ===== subscriptions: relax plan CHECK =====
alter table public.subscriptions drop constraint if exists subscriptions_plan_check;
-- Migrate any non-free test rows back to free (no paying users in prod) before
-- the new CHECK fires.
update public.subscriptions set plan = 'free' where plan <> 'free';
alter table public.subscriptions add constraint subscriptions_plan_check
  check (plan in ('free', 'standard'));

-- ===== credits: unify scans + drafts into contracts =====
alter table public.credits add column if not exists contracts_remaining int not null default 0;
update public.credits set contracts_remaining = coalesce(scans_remaining, 0) + coalesce(drafts_remaining, 0);
alter table public.credits drop column if exists scans_remaining;
alter table public.credits drop column if exists drafts_remaining;

-- Existing rows with the old source string need migrating before the new
-- CHECK is applied.
alter table public.credits drop constraint if exists credits_source_check;
update public.credits set source = 'payg_3usd' where source = 'one_off_9eur';
alter table public.credits add constraint credits_source_check
  check (source in ('payg_3usd', 'admin_grant'));

-- ===== payments: USD default, provider column, overage kind, oxapay support =====
alter table public.payments alter column currency set default 'USD';

alter table public.payments drop constraint if exists payments_kind_check;
alter table public.payments add constraint payments_kind_check
  check (kind in ('subscription_initial', 'subscription_renewal', 'one_off', 'overage'));

alter table public.payments
  add column if not exists provider text not null default 'revolut'
    check (provider in ('revolut', 'oxapay'));

alter table public.payments
  add column if not exists oxapay_track_id text;
create unique index if not exists payments_oxapay_track_id_idx
  on public.payments (oxapay_track_id) where oxapay_track_id is not null;

-- Allow revolut_order_id to be null for oxapay-only payments
alter table public.payments alter column revolut_order_id drop not null;
