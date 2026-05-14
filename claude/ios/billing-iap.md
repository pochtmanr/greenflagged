# iOS billing — StoreKit 2 + server reconciliation

## The constraint

Apple App Store guidelines (3.1.1) require IAP for digital goods/services
sold inside an app. The web's Revolut and OxaPay flows are **web-only**.
The iOS app sells the same plans via StoreKit 2 at higher prices to cover
Apple's 15–30% cut.

Both clients write to the **same Supabase tables** (`subscriptions`, `credits`)
so a user's balance is identical regardless of where they paid. No "Apple plan"
vs "Web plan" — just one plan with one source of truth.

## Products (App Store Connect)

| Product ID | Type | Price | Equivalent web SKU |
|---|---|---|---|
| `gf.payg.credit.1` | Consumable | $3.99 (single) | `payg_3usd` × 1 |
| `gf.standard.monthly` | Auto-renewable subscription | $28.99/mo | `standard` plan |

(Bundle prices like `gf.payg.credit.5` for $17.99 can come later.)

**App Store Connect setup checklist:**
1. Create both products. Family for the subscription: `gf.standard`.
2. App-Specific Shared Secret → `landing/.env` as `APPLE_SHARED_SECRET`.
3. App Store Server Notifications V2 → URL
   `https://flag.red/api/billing/apple/notifications`, version 2 only.
4. Subscription group: `Standard subscriptions` — 1 tier (the monthly).
5. Localized display names: "1 contract credit" / "Standard plan".
6. Review notes: explain "Same as web app, sold via IAP per guidelines".

## Client flow (SwiftUI / StoreKit 2)

```swift
@MainActor
@Observable
final class BillingService {
    var products: [Product] = []
    var purchaseInFlight: Product.ID? = nil

    func load() async throws {
        products = try await Product.products(for: ProductCatalog.allIDs)
    }

    func purchase(_ product: Product) async throws -> PurchaseOutcome {
        let result = try await product.purchase()
        switch result {
        case .success(let verification):
            let transaction = try verification.payloadValue
            try await reconcile(transactionJWS: verification.jwsRepresentation,
                                productID: product.id)
            await transaction.finish()
            return .success
        case .userCancelled:  return .cancelled
        case .pending:        return .pending
        @unknown default:     return .cancelled
        }
    }

    private func reconcile(transactionJWS: String, productID: String) async throws {
        try await APIClient.shared.post(
            "/api/billing/apple/webhook",
            body: AppleReconcilePayload(
                transactionJWS: transactionJWS,
                productID: productID,
                environment: Bundle.main.appStoreReceiptURL?.lastPathComponent == "sandboxReceipt"
                    ? "Sandbox" : "Production"
            )
        )
    }

    /// Re-grant entitlements from any historical transactions
    func restore() async throws {
        for await result in Transaction.currentEntitlements {
            if case .verified(let transaction) = result {
                try await reconcile(
                    transactionJWS: result.jwsRepresentation,
                    productID: transaction.productID
                )
            }
        }
    }
}
```

`ProductCatalog.allIDs` is a static `["gf.payg.credit.1", "gf.standard.monthly"]`.

## Server endpoint — POST `/api/billing/apple/webhook`

**New file in `landing/`:** `app/api/billing/apple/webhook/route.ts`.

Responsibility:
1. Authenticate user via Bearer JWT (RLS-safe).
2. Decode the signed transaction JWS using Apple's public keys
   (use `app-store-server-api` package OR verify manually with JWK fetched from
   `https://api.storekit.itunes.apple.com/inApps/v1/notifications/test`).
3. Validate `bundleID` matches `xyz.flag.green` (or whatever the app ID is).
4. Validate `transactionId` hasn't been reconciled before (insert into
   `payments` keyed on `apple_transaction_id` UNIQUE).
5. Branch on `product_id`:
   - `gf.payg.credit.1`: insert `credits` row with `contracts_remaining = 1`,
     `expires_at = now() + interval '90 days'`, `source = 'apple_payg'`.
   - `gf.standard.monthly`: upsert `subscriptions` row with `plan = 'standard'`,
     `status = 'active'`, `current_period_end = transaction.expiresDate`,
     `provider = 'apple'`, `apple_original_transaction_id = transaction.originalTransactionId`.
6. Insert `payments` audit row.
7. Return current quota state.

```ts
// landing/app/api/billing/apple/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseFromRequest, getSupabaseServiceRole } from "@/lib/supabase/server";
import { verifyAppleJWS } from "@/lib/billing/apple";   // new

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseFromRequest();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const tx = await verifyAppleJWS(body.transaction_jws);

  if (tx.bundleId !== process.env.APPLE_BUNDLE_ID) {
    return NextResponse.json({ error: "bundle_mismatch" }, { status: 400 });
  }

  const svc = getSupabaseServiceRole();

  // dedupe
  const { data: existing } = await svc
    .from("payments")
    .select("id")
    .eq("apple_transaction_id", tx.transactionId)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ ok: true, dedup: true });
  }

  if (tx.productId === "gf.payg.credit.1") {
    await svc.from("credits").insert({
      user_id: user.id,
      contracts_remaining: 1,
      expires_at: new Date(Date.now() + 90 * 86400_000).toISOString(),
      source: "apple_payg",
    });
  } else if (tx.productId === "gf.standard.monthly") {
    await svc.from("subscriptions").upsert({
      user_id: user.id,
      plan: "standard",
      status: "active",
      provider: "apple",
      apple_original_transaction_id: tx.originalTransactionId,
      current_period_start: new Date(tx.purchaseDate).toISOString(),
      current_period_end: new Date(tx.expiresDate).toISOString(),
    }, { onConflict: "user_id" });
  }

  await svc.from("payments").insert({
    user_id: user.id,
    apple_transaction_id: tx.transactionId,
    provider: "apple",
    kind: tx.productId === "gf.payg.credit.1" ? "one_off" : "subscription_initial",
    amount_minor: tx.price ?? 0,
    currency: tx.currency ?? "USD",
    status: "succeeded",
  });

  return NextResponse.json({ ok: true });
}
```

## Server endpoint — POST `/api/billing/apple/notifications`

App Store Server Notifications V2 (renewals, refunds, billing retry).

Handle these notification types:
- `DID_RENEW` → upsert subscriptions with new period_end
- `DID_FAIL_TO_RENEW` → status = `past_due`
- `EXPIRED` → status = `canceled`
- `REFUND` → mark payments.status = `refunded`, revoke credits if PAYG

Verify the signed payload using Apple's public keys. No user auth (Apple is the
caller); idempotency via `notificationUUID`.

## DB migration needed

New migration `landing/supabase/migrations/0012_apple_iap.sql`:

```sql
alter table payments
  add column if not exists provider text not null default 'revolut'
    check (provider in ('revolut','oxapay','apple')),
  add column if not exists apple_transaction_id text unique;

alter table subscriptions
  add column if not exists provider text not null default 'revolut'
    check (provider in ('revolut','oxapay','apple')),
  add column if not exists apple_original_transaction_id text unique;

alter table credits
  drop constraint if exists credits_source_check,
  add constraint credits_source_check
    check (source in ('one_off_9eur','payg_3usd','apple_payg','admin_grant'));
```

## Env vars to add

```
APPLE_BUNDLE_ID=xyz.flag.green
APPLE_SHARED_SECRET=...                # from App Store Connect
APPLE_ISSUER_ID=...                    # for App Store Server API
APPLE_KEY_ID=...
APPLE_PRIVATE_KEY_BASE64=...           # the .p8 file, base64-encoded
```

## Receipt validation

Two options:
1. **Decode JWS locally** with Apple's published JWK set (`/inApps/v1/keys`).
   Fastest, no extra Apple API call. Use `jose` package (Edge-compatible).
2. **Send to App Store Server API**. More auditable. Adds ~200ms per purchase.

Phase 6 implementation: option 1 (JWS decode) — simpler, faster. Cache the JWK
set for 24h.

## Edge cases

- **User signs out and back in** with different account: `restore()` re-applies
  any active entitlement on the new Supabase user. We attach the
  `originalTransactionId` to the *current* Supabase user at reconcile time. If
  the same Apple ID was previously bound to a different Supabase user, we
  detect this in the webhook and refuse with `409 transaction_already_bound`.
- **Refund**: Apple notification arrives async. Server marks credits expired or
  subscription canceled. iOS app refreshes quota on next launch.
- **Sandbox vs production**: client tells server which environment via
  `environment` field. Server picks the right Apple endpoint.

## What this gives us

- A single quota source of truth (Supabase).
- iOS users can pay without leaving the app.
- Web users keep their cheaper prices (no Apple cut).
- Cross-platform: a web Standard subscriber sees their plan when they log in
  on iOS — no re-purchase needed.
- Restore purchases works on a new device.

## What this costs us

- 15–30% Apple cut on iOS revenue.
- ~1 week of build work (Phase 6).
- App Store review will scrutinize this — be ready to explain "Same product as
  flag.red web, sold via IAP per guideline 3.1.1".
