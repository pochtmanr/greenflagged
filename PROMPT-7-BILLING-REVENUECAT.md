# PROMPT 7 — StoreKit 2 + RevenueCat (guided session)

**Working directory:** `/Users/romanpochtman/Developer/ContractChecker/`
**Suggested agent:** `swift-ui-architect` (Roman runs this as a fresh session and works alongside Claude across Xcode + App Store Connect + RevenueCat dashboard)
**Depends on:** P3 (APIClient), P6 (Settings MANAGE BILLING button exists)
**Blocks:** nothing
**Estimated size:** ~3–4 hours of coding + Roman's time in App Store Connect

---

## Read first

```
mempalace search "doppler revenuecat appstore" --wing doppler
mempalace search "greenflagged ios billing" --wing greenflagged
```

Then read:
1. `AGENTS.md`, `CLAUDE.md` — repo rules. Stay on `main`. Never commit secrets.
2. `ios/Green Flagged/Green Flagged/Features/Billing/BillingService.swift` — stub you're replacing.
3. `landing/lib/billing/guard.ts`, `landing/lib/billing/revolut.ts` — existing web billing logic to understand how quotas + entitlements flow on Roman's other channel.
4. `landing/app/api/billing/webhook/route.ts` and any sibling webhook routes — the pattern you'll mirror for the new RevenueCat webhook.
5. The Supabase schema for `subscriptions`, `usage_events`, `credits` — query via:
   ```bash
   mempalace search "greenflagged supabase subscriptions schema" --wing greenflagged
   ```
6. `claude/ios/billing-iap.md` if it exists — earlier billing design notes.

## Goal

Bring iOS billing to feature parity with the web's Revolut flow, **but via Apple IAP** (App Store rules require this for digital subscriptions). RevenueCat is the SDK that turns StoreKit 2 into a tidy SDK + dashboards + server webhook.

End state:
- User taps `MANAGE BILLING` in Settings → `PaywallView` opens.
- They see the Standard subscription ($28.99/mo) and the single-credit PAYG ($3.99).
- They pick → Apple's native purchase sheet → success → entitlement is active → web's `subscriptions` table reflects this (via the RC webhook).
- The same paywall surfaces automatically when `/api/scan` or `/api/contracts/draft` returns 402.

This prompt is a **guided session**. Claude codes; Roman drives Xcode UI + App Store Connect + RevenueCat dashboard with Claude narrating each step.

## Pre-flight (Roman does)

Before starting the session:
- [ ] App Store Connect account active and the app `Green Flagged` exists with bundle id `xyz.flag.green`.
- [ ] Apple paid-apps agreement signed (otherwise IAP testing is blocked).
- [ ] A RevenueCat account exists (Roman has one for Doppler — re-use the same org, add a new project named `Green Flagged`).
- [ ] You have admin access in both.

Claude will pause at each step that requires Roman's action.

## Tasks

### Task 1 — App Store Connect: create the products

Roman, in App Store Connect:

1. **App** → Monetization → In-App Purchases → "+" → **Auto-Renewable Subscription**.
   - Subscription Group: create `Green Flagged Standard` (reference name).
   - Reference name: `Standard Monthly`.
   - Product ID: `gf.standard.monthly`.
   - Duration: 1 Month.
   - Price: $28.99 USD (or whatever tier Roman chooses — match `BillingService.swift:6` doc string).
   - Localization (English): name `Green Flagged Standard`, description `10 contract scans or drafts per month. Renews monthly.`.
   - Review screenshot: take a screenshot of the paywall once the iOS code is built; can upload later in review.
2. **+ Consumable**:
   - Reference name: `PAYG Credit`.
   - Product ID: `gf.payg.credit.1`.
   - Price: $3.99 USD.
   - Localization: `One Contract Credit`, `One scan or draft. Valid 90 days.`.

3. Apple-Specific Review Information: leave for review submission later.

4. **Don't submit for review yet** — once the products are in "Ready to Submit" they're testable in sandbox.

### Task 2 — RevenueCat: configure project

In RevenueCat dashboard:

1. New Project → `Green Flagged` under Roman's existing org.
2. **Apps** → Add → iOS → bundle id `xyz.flag.green`.
3. **App Store Connect API** → upload Roman's existing in-app purchase API key (from App Store Connect → Users and Access → Keys → In-App Purchase). If a new key is needed, create one with the In-App Purchase role.
4. **Products** → Add → Import from App Store. Pull in `gf.standard.monthly` and `gf.payg.credit.1`.
5. **Entitlements** → Create:
   - `standard` — granted by `gf.standard.monthly`.
   - (PAYG doesn't grant an entitlement — it's a one-off consumable that the webhook records as a credit on the server.)
6. **Offerings** → Create `default`:
   - Package `standard` (monthly): product `gf.standard.monthly`.
   - Package `payg`: product `gf.payg.credit.1`.
7. **API Keys** → copy:
   - **iOS SDK key** (public — goes in the iOS app config).
   - **Secret API key** (for the webhook → server).
   Save both in a secure note for the next steps; never commit them.

### Task 3 — Wire RC SDK keys into iOS config

The iOS app reads non-secret keys from `Info.plist` populated by `Secrets.xcconfig`. Add an entry the same way `SUPABASE_URL` is wired in `AppConfig.swift`:

1. Edit `ios/Green Flagged/Green Flagged/Secrets.xcconfig` (locally, never committed) — add:
   ```
   REVENUECAT_SDK_KEY = <the public iOS SDK key from RC>
   ```
2. Edit `ios/Green Flagged/Info.plist` — add above `</dict>`:
   ```xml
   <key>REVENUECAT_SDK_KEY</key>
   <string>$(REVENUECAT_SDK_KEY)</string>
   ```
3. Edit `Core/AppConfig.swift` — add:
   ```swift
   nonisolated static let revenuecatKey: String = try! readString("REVENUECAT_SDK_KEY")
   ```

### Task 4 — Add RevenueCat SDK via SPM

In Xcode: File → Add Package Dependencies → `https://github.com/RevenueCat/purchases-ios` → version `5.0.0` or later. Add the `RevenueCat` library to the `Green Flagged` target.

Confirm SPM resolution in `Green Flagged.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved` checks in clean.

### Task 5 — Rewrite `BillingService`

Replace `ios/Green Flagged/Green Flagged/Features/Billing/BillingService.swift`:

```swift
import Foundation
import RevenueCat

@MainActor
@Observable
final class BillingService {
    static let shared = BillingService()

    enum Entitlement: String { case standard }

    private(set) var offerings: Offerings? = nil
    private(set) var customerInfo: CustomerInfo? = nil
    private(set) var loadError: String? = nil
    private(set) var isLoading: Bool = false

    private init() {}

    /// Configure RC at app launch. Idempotent.
    func configure() {
        Purchases.configure(withAPIKey: AppConfig.revenuecatKey)
        Purchases.shared.delegate = RCDelegate.shared
        Purchases.logLevel = .error  // bump to .debug locally if needed
    }

    /// Identify the RC user with the Supabase user id so the webhook can map.
    func login(supabaseUserId: String) async {
        _ = try? await Purchases.shared.logIn(supabaseUserId)
        await refreshAll()
    }

    func logout() async {
        _ = try? await Purchases.shared.logOut()
        customerInfo = nil
    }

    func refreshAll() async {
        isLoading = true
        defer { isLoading = false }
        do {
            offerings = try await Purchases.shared.offerings()
            customerInfo = try await Purchases.shared.customerInfo()
            loadError = nil
        } catch {
            loadError = error.localizedDescription
        }
    }

    func purchase(package: Package) async throws -> CustomerInfo {
        let result = try await Purchases.shared.purchase(package: package)
        if result.userCancelled { throw BillingError.userCancelled }
        customerInfo = result.customerInfo
        return result.customerInfo
    }

    func restore() async throws -> CustomerInfo {
        let info = try await Purchases.shared.restorePurchases()
        customerInfo = info
        return info
    }

    var hasStandardEntitlement: Bool {
        customerInfo?.entitlements[Entitlement.standard.rawValue]?.isActive == true
    }
}

enum BillingError: Error, LocalizedError {
    case userCancelled
    case unknown(String)
    var errorDescription: String? {
        switch self {
        case .userCancelled: "Cancelled."
        case .unknown(let m): m
        }
    }
}

final class RCDelegate: NSObject, PurchasesDelegate, @unchecked Sendable {
    static let shared = RCDelegate()
    func purchases(_ purchases: Purchases, receivedUpdated customerInfo: CustomerInfo) {
        Task { @MainActor in
            BillingService.shared.customerInfo = customerInfo
        }
    }
}
```

Hook lifecycle:
- In `Green_FlaggedApp.swift` (app entry): call `BillingService.shared.configure()` before `WindowGroup` body builds (e.g. in the `init()` of the `App` struct).
- In `Session.swift` — after a successful sign-in/refresh that yields a `userId`, call `Task { await BillingService.shared.login(supabaseUserId: id) }`. On sign-out, call `await BillingService.shared.logout()`.

### Task 6 — Build `PaywallView`

Create `ios/Green Flagged/Green Flagged/Features/Billing/PaywallView.swift`:

Layout:
- Header: `// MANAGE BILLING` label, `Stay green-flagged` h2.
- Current plan card: shows `STANDARD ACTIVE` if entitlement live (with expiry date and "manage in App Store" link), else `FREE TIER`.
- Standard package card: `GFFrame` with monthly price (read from `package.localizedPriceString`), feature bullets, `SUBSCRIBE` solid `GFButton`.
- PAYG package card: `GFFrame` with single-credit price, `BUY 1 CREDIT` ghost button.
- Restore link: `GFButton(.link, "RESTORE PURCHASES")`.
- "MANAGE IN APP STORE" link → opens `https://apps.apple.com/account/subscriptions`.

Wire the SUBSCRIBE / BUY tap:
```swift
Task {
    do {
        _ = try await BillingService.shared.purchase(package: pkg)
        // Trigger a refresh on the server too — see Task 7.
        if let token = await session.currentAccessToken() {
            _ = try? await APIClient.shared.refreshEntitlement(token: token)
        }
        dismiss()
    } catch BillingError.userCancelled {
        // silent
    } catch {
        errorMessage = error.localizedDescription
    }
}
```

Present `PaywallView` as a `.sheet` from Settings' MANAGE BILLING button. Also wire it from `ScanView` and `DraftWizard` on a 402 (instead of just an error message). Reuse a single `@State private var showPaywall: Bool` per screen.

### Task 7 — Server webhook + entitlement refresh

Create `landing/app/api/billing/revenuecat/webhook/route.ts`:

```ts
import { NextResponse } from "next/server";
import { getSupabaseServiceRole } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RC_SECRET = process.env.REVENUECAT_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  // RC sends a static bearer (you set it in the RC dashboard webhook config).
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${RC_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await req.json();
  const event = payload?.event;
  const type = event?.type as string | undefined;
  const appUserId = event?.app_user_id as string | undefined;
  const productId = event?.product_id as string | undefined;
  if (!type || !appUserId) {
    return NextResponse.json({ error: "Malformed event" }, { status: 400 });
  }

  const admin = getSupabaseServiceRole();

  // Map event types → DB writes. Minimum coverage:
  //   INITIAL_PURCHASE / RENEWAL / UNCANCELLATION  → subscriptions.status='active'
  //   CANCELLATION                                  → cancel_at_period_end=true
  //   EXPIRATION                                    → status='expired'
  //   NON_RENEWING_PURCHASE (PAYG credit)           → credits row +1 with 90d expiry
  switch (type) {
    case "INITIAL_PURCHASE":
    case "RENEWAL":
    case "UNCANCELLATION":
      await admin.from("subscriptions").upsert({
        user_id: appUserId,
        plan: "standard",
        status: "active",
        // Use event.expiration_at_ms / period_end if RC sends them.
        current_period_end: event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null,
        cancel_at_period_end: false,
      }, { onConflict: "user_id" });
      break;
    case "CANCELLATION":
      await admin.from("subscriptions").update({ cancel_at_period_end: true }).eq("user_id", appUserId);
      break;
    case "EXPIRATION":
      await admin.from("subscriptions").update({ status: "expired" }).eq("user_id", appUserId);
      break;
    case "NON_RENEWING_PURCHASE":
      await admin.from("credits").insert({
        user_id: appUserId,
        contracts_remaining: 1,
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        source: "ios_payg",
      });
      break;
    default:
      // Ignore TEST, BILLING_ISSUE, etc. — server doesn't need them yet.
      break;
  }

  return NextResponse.json({ ok: true });
}
```

Add the secret to whatever env-var store the landing app uses (Vercel? Roman keeps env in Doppler? — confirm). Then in the RC dashboard → Integrations → Webhooks → add `https://greenflagged.xyz/api/billing/revenuecat/webhook` with the Bearer secret.

Also add a synchronous "kick the cache" endpoint Claude already referenced — `POST /api/billing/refresh-entitlement` — for the iOS post-purchase fast-path. It calls RC's REST API directly with the secret key to read the user's current entitlements and writes them to `subscriptions` immediately (bypassing webhook propagation lag of ~5–60s).

Add `APIClient.refreshEntitlement(token:)` → POST that endpoint, no body, expects 200.

### Task 8 — Quota guard awareness

In `landing/lib/billing/guard.ts`, ensure `guardQuota(user_id, kind)` already reads:
- `subscriptions.status === "active"` for plan tier.
- `credits` for PAYG remaining.

If it currently only reads Revolut's tables, extend it so RC-sourced entries count equally. Often it already does — Revolut and RC both land rows in the same `subscriptions` / `credits` tables, just with different `source` values. Confirm before changing.

### Task 9 — Settings billing section update

Update `Features/Settings/SettingsView.swift` `billingSection`:

```swift
private var billingSection: some View {
    GFCard {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("BILLING")
                    .font(.gf.label)
                    .tracking(1.0)
                    .foregroundStyle(Color.gf.fg2)
                Spacer()
                GFTag(label: billing.hasStandardEntitlement ? "STANDARD" : "FREE", severity: .green)
            }

            Spacer().frame(height: Spacing.s3)

            Text(billing.hasStandardEntitlement
                 ? "Standard plan — 10 contracts/month, renews monthly."
                 : "Free tier — 1 contract per month. Upgrade for more.")
                .font(.gf.bodySm)
                .foregroundStyle(Color.gf.fg2)
                .fixedSize(horizontal: false, vertical: true)

            Spacer().frame(height: Spacing.s4)

            GFButton(label: "MANAGE BILLING", style: .ghost) {
                showPaywall = true
            }
        }
    }
    .sheet(isPresented: $showPaywall) { PaywallView() }
}
```

Add `@State private var showPaywall = false` and inject `BillingService` via `@Environment(BillingService.self) private var billing` (or a simpler `@State` reference to `.shared` if you don't want the env wiring).

### Task 10 — Light handling on Scan/Draft 402

In `ScanView` and `DraftWizard`, change the 402 error branch to set `showPaywall = true` and present the same `PaywallView`. The error state still shows briefly before the sheet opens.

## Constraints

- **Stay on `main`**. No PR.
- Never commit `Secrets.xcconfig`, `REVENUECAT_SDK_KEY`, the webhook secret, or any service-role key.
- The PAYG product is a **non-consumable from Apple's perspective**? **No — it's consumable.** Verify the App Store Connect product type is "Consumable" so users can buy more than one credit.
- All charges must use Apple's purchase sheet — never call any third-party payment URL from the iOS app for a digital subscription. Apple will reject.
- The server webhook MUST be idempotent — RC retries on 5xx. Use upserts and `ON CONFLICT` semantics.
- Don't break the Revolut flow on the web — it stays in production for the web channel; iOS adds RC as a parallel channel.
- The same Supabase user can have an active subscription via either Revolut OR RC, never both at once. `guardQuota` should accept either; if both are active (e.g. user subscribed on web then bought standard on iOS), that's a billing problem to address operationally, not a code bug.

## Done when

- [ ] Both products exist in App Store Connect.
- [ ] RC project configured with offerings + entitlement + webhook.
- [ ] `BillingService` configured at launch; logs in/out with session.
- [ ] `PaywallView` renders both packages with localized prices.
- [ ] Buying Standard in sandbox grants the entitlement; Settings reflects it.
- [ ] Buying PAYG credits the user; the server `credits` row shows 1 contract remaining.
- [ ] `/api/billing/revenuecat/webhook` returns 200 for an RC test event and writes the row.
- [ ] `/api/scan` 402 triggers the paywall instead of just an error in iOS.
- [ ] Build passes; sandbox purchase end-to-end works on Roman's iPhone.

## Verification

```bash
cd landing && pnpm tsc --noEmit && cd ..
xcodebuild -project "ios/Green Flagged/Green Flagged.xcodeproj" \
           -scheme "Green Flagged" \
           -sdk iphoneos \
           -configuration Debug \
           build \
           CODE_SIGNING_ALLOWED=NO
```

Sandbox test plan on Roman's iPhone with a sandbox-tester Apple ID (Settings → App Store → Sandbox Account):
1. Sign in to Green Flagged.
2. Settings → MANAGE BILLING → paywall opens, prices show.
3. Tap SUBSCRIBE on Standard → Apple sheet → confirm → toast/success → close paywall.
4. Settings tag now reads STANDARD.
5. Run a `/api/scan` → 200 (quota allowed because of active subscription).
6. Roman cancels the sandbox subscription from Settings → App Store → Subscriptions → wait for expiration → re-check paywall reads FREE.
7. Buy PAYG credit → credits row appears in Supabase.

## Out of scope

- Promo codes / introductory offers — defer.
- Family Sharing — Apple-default behavior is fine; no special code.
- Refund flow — Apple handles; webhook receives `BILLING_ISSUE` if anything weird happens.
- Auto-restore on every launch — RC handles entitlements automatically; we only need an explicit "RESTORE PURCHASES" link for users who reinstall.
- Annual subscriptions or higher tiers — single Standard tier is enough for v1.

---

**Final note for Claude:** This prompt expects Roman to be in the loop. Pause and confirm before each App Store Connect / RevenueCat dashboard step. Show what Roman is about to do, wait for "ok done", then proceed. Code edits are fine to do without pausing.
