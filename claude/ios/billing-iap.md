# iOS billing — RevenueCat + Supabase reconciliation

## The constraint

Apple App Store guideline 3.1.1 requires IAP for digital goods sold inside an
app. The web's Revolut and OxaPay flows are **web-only**. iOS sells the same
plans via the App Store at higher prices (Apple's 15–30% cut).

Both clients write to the **same Supabase tables** (`subscriptions`, `credits`)
so a user's balance is identical regardless of where they paid. There is no
"Apple plan" vs "Web plan" — one plan, one source of truth.

## Why RevenueCat (not StoreKit direct)

The deciding factor is **server-side renewal events while the app is closed**.
RC's webhook fires on `RENEWAL`, `EXPIRATION`, `BILLING_ISSUE`, `REFUND` etc.
without depending on the app being open. With StoreKit-direct + App Store
Server Notifications V2 we'd have to host JWS verification and Apple key
rotation ourselves; RC handles all of it and lets us own the schema.

The architecture mirrors Doppler's RevenueCat+Supabase pattern (see
`/Users/roman/Developer/Doppler/ios/PulseVPN/Services/RevenueCatService.swift`)
but Green Flagged uses Supabase as the canonical entitlement store (because
web also writes to it), with RC's `customerInfo` only as a fallback when
Supabase is unreachable.

## Products (App Store Connect)

| Product ID | Type | Price | Equivalent web SKU |
|---|---|---|---|
| `gf.payg.credit.1` | Consumable | $3.99 (1 credit) | `payg_3usd` × 1 |
| `gf.standard.monthly` | Auto-renewable subscription | $28.99/mo | `standard` plan |

**Bundle:** `xyz.flag.green`. **Subscription group:** `Green Flagged Standard`.

## RevenueCat dashboard

- Project: `Green Flagged`, bundle id `xyz.flag.green`.
- Entitlement: `standard` → mapped to `gf.standard.monthly`.
- Offering: `default` with two packages (monthly subscription, consumable).
- Webhook URL: `https://greenflagged.xyz/api/billing/revenuecat/webhook`, custom
  header `Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>`.

## Env vars

- `landing/.env`: `REVENUECAT_WEBHOOK_SECRET` (random string; matches RC
  dashboard custom header).
- `ios/Secrets.xcconfig`: `REVENUECAT_IOS_API_KEY` (the public `appl_…` key
  from the RC dashboard; the **secret** key never leaves the server).

## Schema

`landing/supabase/migrations/0012_billing_apple.sql` adds:

- `subscriptions.provider` (`'revolut' | 'oxapay' | 'apple'`), default
  `'revolut'`.
- `subscriptions.apple_original_transaction_id` (UNIQUE) and
  `subscriptions.apple_product_id`.
- `payments.apple_transaction_id` (UNIQUE) and extends
  `payments.provider` to include `'apple'`.
- `credits.apple_transaction_id` (UNIQUE) and extends `credits.source` to
  include `'apple_payg'`.

Plus two `SECURITY DEFINER` RPCs called by the iOS client immediately after
purchase/restore:

- `claim_apple_subscription(p_original_transaction_id, p_product_id, p_expires_at)` →
  binds the originalTransactionId to the current `auth.uid()`. Returns
  `{action:'success'}` on first claim or self-update, `{action:'rejected',
  owner:<uuid>}` if another Supabase user already owns the receipt.
- `claim_apple_payg(p_transaction_id, p_product_id, p_quantity)` →
  inserts a `credits` row (`source='apple_payg'`,
  `expires_at = now() + interval '90 days'`). Idempotent on
  `apple_transaction_id`.

## Client flow (iOS)

```
[App launch]
  Purchases.configure(withAPIKey: AppConfig.revenueCatAPIKey)
  RevenueCatService.shared.configure()   // installs delegate
  RevenueCatService.shared.fetchOfferings()

[Sign in]
  Session.refreshProfile(for: user)
    → RevenueCatService.shared.logIn(userId: user.id.uuidString)
    → EntitlementGate.shared.refresh()

[Purchase]
  BillingPaywallView → RevenueCatService.purchase(package, syncing: sync)
    → Purchases.shared.purchase(package:)
    → SubscriptionSyncService.claimSubscription(...)
       → claim_apple_subscription RPC
    → EntitlementGate.shared.refresh()

[Restore]
  RESTORE PURCHASES → RevenueCatService.restore(syncing:)
    → Purchases.shared.restorePurchases()
    → SubscriptionSyncService.claimSubscription(...)
    → EntitlementGate.shared.refresh()

[Sign out]
  Session.signOut()
    → RevenueCatService.shared.logOut()
    → EntitlementGate.shared.reset()
```

## Server webhook — POST `/api/billing/revenuecat/webhook`

`landing/app/api/billing/revenuecat/webhook/route.ts`. Authentication: the
RC dashboard sends a custom `Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>`
header. The route uses `timingSafeEqual` to validate.

Events handled (idempotent on `apple_transaction_id`):

- `INITIAL_PURCHASE`, `RENEWAL`, `PRODUCT_CHANGE`, `TRANSFER` → upsert
  `subscriptions` (plan=`standard`, provider=`apple`, period_end=event
  expiration). Insert `payments` row.
- `CANCELLATION` → `subscriptions.cancel_at_period_end = true` (user keeps
  access until period_end).
- `EXPIRATION` → `subscriptions.status = 'expired'`.
- `BILLING_ISSUE` → `subscriptions.status = 'past_due'`.
- `UNCANCELLATION` → clear `cancel_at_period_end`.
- `NON_RENEWING_PURCHASE` → insert `credits` row with `apple_payg` source.

`event.app_user_id` is the Supabase user id (set by the client's
`Purchases.shared.logIn(userId:)`).

The webhook is **complementary** to the client RPC: the client call binds the
transaction to the current user the moment the purchase completes; the
webhook keeps the row fresh during renewals/refunds while the app is closed.

## Entitlement gate — UI source of truth

`EntitlementGate` reads `subscriptions` + `credits` from Supabase. RC's
`customerInfo` is only the fallback when the network read fails. This matters
because a web Standard subscriber logging in on iOS will have a
`subscriptions` row but no RC entitlement — Supabase must win.

The gate exposes `isStandard`, `creditsRemaining`, `currentPeriodEnd`. The
Dashboard tag, Settings billing card, and Scan paywall all read from it via
`@Environment(EntitlementGate.self)` injected at `RootView`.

## Paywall

`Features/Billing/BillingPaywallView.swift` is a full-screen cover with two
GFCards (Standard + PAYG). Triggered:

1. **Quota exceeded** during scan — `ScanView` catches `APIError.quotaExceeded`
   and presents the paywall instead of erroring.
2. **Settings → UPGRADE** for users on the free tier.
3. **Settings → MANAGE SUBSCRIPTION** for Standard users opens
   `https://apps.apple.com/account/subscriptions` instead (Apple owns this
   UX).

Design follows `claude/design/tokens.md`: dark `#121212` background, sharp 2px
corners, UPPERCASE JetBrains Mono labels, Inter body, green is the only
decorative color. No `backdrop-blur`.

## Edge cases

- **Cross-account theft attempt.** A user who signs in with a different
  Supabase account on a device with an active Apple ID entitlement triggers
  `claim_apple_subscription` → `{action:'rejected', owner:<other_uuid>}`.
  `RevenueCatService` stores `rejectedOriginalTransactionId` so the gate
  ignores the RC entitlement; UI continues to show FREE TIER.
- **Refund.** Apple notification arrives async via the RC webhook
  (`EXPIRATION` for subs; for PAYG, no fully reliable Apple signal — manual
  admin grant correction may be needed).
- **Sandbox vs production.** RC handles both; `event.environment` is logged
  in the `payments.raw` jsonb for forensics.

## What App Review needs to know

- Both products are the same digital good as `greenflagged.xyz` (the web app).
- Higher in-app prices reflect Apple's commission ($28.99 vs $25; $3.99 vs
  $3.00). Per guideline 3.1.3(b) this is permitted.
- Review notes should explain: "Same product as greenflagged.xyz web; sold via IAP
  per guideline 3.1.1. Subscriptions can be managed from
  Settings → BILLING → MANAGE SUBSCRIPTION."
