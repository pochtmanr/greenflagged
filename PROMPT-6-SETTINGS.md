# PROMPT 6 — Settings overhaul + Onboarding dropdown unification

**Working directory:** `/Users/romanpochtman/Developer/ContractChecker/`
**Suggested agent:** `swift-ui-architect`
**Depends on:** nothing (but coordinates a shared `GFDropdown` component that P5 may also want — P6 ships it first)
**Blocks:** nothing
**Estimated size:** ~2–3 hours

---

## Read first

```
mempalace search "greenflagged design dropdown card" --wing greenflagged --room design
mempalace search "greenflagged ios settings delete account" --wing greenflagged
```

Then read:
1. `AGENTS.md`, `CLAUDE.md` — repo rules.
2. `ios/Green Flagged/Green Flagged/Features/Settings/SettingsView.swift` — what you're rewriting.
3. `ios/Green Flagged/Green Flagged/Features/Onboarding/OnboardingFlow.swift` — currently uses `RadioCard` for account-type selection (lines 113–123). You're swapping these for dropdowns.
4. `ios/Green Flagged/Green Flagged/Models/Profile.swift` — `AccountType` enum lives near here (used by both Settings and Onboarding).
5. `ios/Green Flagged/Green Flagged/Core/ThemePreference.swift` — `ThemePreference` enum used by the appearance picker.
6. `ios/Green Flagged/Green Flagged/Design/GFInput.swift`, `GFCard.swift`, `GFButton.swift` — primitives.
7. `ios/Green Flagged/Green Flagged/Core/Session.swift` — for sign-out + keychain clear during delete account.

## Goal

Five distinct changes:

1. **`GFDropdown` shared component** — a reusable dropdown styled to match the existing country `Picker(.menu)` chrome (`SettingsView.swift:155-172`). Both Settings and Onboarding will use it.
2. **Settings: chips → dropdown** — account type (currently `GFButton` chips, lines 133–145) becomes a `GFDropdown`. Appearance picker (currently `.segmented`, lines 198–203) becomes a `GFDropdown`.
3. **Onboarding: RadioCard → dropdown** — account-type step (`OnboardingFlow.swift:113-123`) swaps to the same `GFDropdown` component.
4. **Delete Account + Support** — new sections at the bottom of Settings:
   - **Delete Account** with confirm flow → call `DELETE /api/account` (creates this endpoint on the server) → clear keychain + sign out.
   - **Support** with two actions: "EMAIL US" (`mailto:hello@greenflagged.xyz`) and "SEND A QUERY" (prefilled mailto with device/app metadata in the body).

## Tasks

### Task 1 — Build `GFDropdown`

Create `ios/Green Flagged/Green Flagged/Design/GFDropdown.swift`:

```swift
import SwiftUI

/// Project-standard dropdown. Same visual chrome as the country picker in
/// SettingsView so the whole form feels coherent. Use this anywhere you'd
/// reach for SwiftUI's Picker(.menu) — it bakes in the GF border, padding,
/// background, and corner radius.
struct GFDropdown<Value: Hashable, Label: View>: View {
    let title: String          // accessibility label, not visible
    @Binding var selection: Value
    let options: [Value]
    @ViewBuilder var optionLabel: (Value) -> Label

    var body: some View {
        Picker(title, selection: $selection) {
            ForEach(options, id: \.self) { v in
                optionLabel(v).tag(v)
            }
        }
        .pickerStyle(.menu)
        .tint(Color.gf.fg1)
        .padding(.horizontal, Spacing.s3)
        .padding(.vertical, Spacing.s2)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.gf.surfaceElev)
        .overlay(
            RoundedRectangle(cornerRadius: Radius.sharp)
                .stroke(Color.gf.rule, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: Radius.sharp))
    }
}
```

That's intentionally tiny — it's the existing inline chrome promoted to a struct. No new tokens, no new behaviors.

### Task 2 — Settings account-type → dropdown

Replace lines 126–146 (`accountTypeRow`) in `SettingsView.swift`:

```swift
private var accountTypeRow: some View {
    VStack(alignment: .leading, spacing: Spacing.s2) {
        Text("// ACCOUNT TYPE")
            .font(.gf.label)
            .tracking(1.0)
            .foregroundStyle(Color.gf.fg3)

        GFDropdown(title: "Account type", selection: $accountType, options: AccountType.allCases) { type in
            Text(type.label).foregroundStyle(Color.gf.fg1)
        }
        .onChange(of: accountType) { _, _ in didJustSave = false }
    }
}
```

### Task 3 — Settings appearance → dropdown

Replace lines 190–206 (`appearanceSection`):

```swift
private var appearanceSection: some View {
    GFCard {
        VStack(alignment: .leading, spacing: Spacing.s3) {
            Text("APPEARANCE")
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(Color.gf.fg2)

            GFDropdown(
                title: "Appearance",
                selection: themeBinding,
                options: ThemePreference.allCases
            ) { pref in
                Text(pref.label).foregroundStyle(Color.gf.fg1)
            }
        }
    }
}

private var themeBinding: Binding<ThemePreference> {
    Binding(
        get: { ThemePreference(rawValue: themeRaw) ?? .system },
        set: { themeRaw = $0.rawValue }
    )
}
```

### Task 4 — Onboarding account-type → dropdown

In `OnboardingFlow.swift` `AccountTypeStep`, replace the `ForEach + RadioCard` block (lines 113–123) with:

```swift
GFCard {
    VStack(alignment: .leading, spacing: Spacing.s3) {
        Text("// ACCOUNT TYPE")
            .font(.gf.label)
            .tracking(1.0)
            .foregroundStyle(Color.gf.fg3)

        GFDropdown(title: "Account type", selection: $accountType, options: AccountType.allCases) { type in
            Text(type.label).foregroundStyle(Color.gf.fg1)
        }

        // Keep the short description so the user understands what they
        // picked — but now as supporting copy under the dropdown, not
        // inside a giant radio card.
        Text(description(for: accountType))
            .font(.gf.bodySm)
            .foregroundStyle(Color.gf.fg2)
            .fixedSize(horizontal: false, vertical: true)
    }
}
```

You can now delete `RadioCard` and `RadioIndicator` (lines 307–354) — they're unused. Verify with grep before deleting.


Insert a `supportSection` view between `aboutSection` and `sessionSection` in `SettingsView.body`:

```swift
private var supportSection: some View {
    GFCard {
        VStack(alignment: .leading, spacing: 0) {
            Text("SUPPORT")
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(Color.gf.fg2)

            Spacer().frame(height: Spacing.s3)

            Text("Stuck on something? Email us and we'll get back within a day.")
                .font(.gf.bodySm)
                .foregroundStyle(Color.gf.fg3)
                .fixedSize(horizontal: false, vertical: true)

            Spacer().frame(height: Spacing.s4)

            HStack(spacing: Spacing.s3) {
                GFButton(label: "EMAIL US", style: .solid) {
                    if let url = URL(string: "mailto:hello@greenflagged.xyz") { openURL(url) }
                }
                GFButton(label: "SEND A QUERY", style: .ghost) {
                    openURL(supportQueryURL)
                }
            }
        }
    }
}

private var supportQueryURL: URL {
    var components = URLComponents(string: "mailto:hello@greenflagged.xyz")!
    let version = appVersion
    let build = (Bundle.main.infoDictionary?["CFBundleVersion"] as? String) ?? "?"
    let device = "\(UIDevice.current.systemName) \(UIDevice.current.systemVersion)"
    let model = UIDevice.current.model
    let body = """
    Describe your issue below.

    ---
    App: Green Flagged \(version) (\(build))
    Device: \(model) · \(device)
    User: \(emailDisplay)
    """
    components.queryItems = [
        URLQueryItem(name: "subject", value: "Green Flagged support"),
        URLQueryItem(name: "body", value: body),
    ]
    return components.url!
}
```

Confirm the canonical support alias with Roman before shipping. If `hello@greenflagged.xyz` isn't yet routed, use `support@greenflagged.xyz` or whatever inbox he has set up. **Don't invent the address — ask if uncertain.**

### Task 7 — Delete Account section

Insert a `dangerZoneSection` view at the very bottom of Settings (after `sessionSection`):

```swift
@State private var showingDeleteConfirm: Bool = false
@State private var isDeleting: Bool = false
@State private var deleteError: String? = nil

private var dangerZoneSection: some View {
    GFCard {
        VStack(alignment: .leading, spacing: 0) {
            Text("DANGER ZONE")
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(Color.gf.sevRed)

            Spacer().frame(height: Spacing.s3)

            Text("Permanently delete your account and all contracts. This can't be undone.")
                .font(.gf.bodySm)
                .foregroundStyle(Color.gf.fg2)
                .fixedSize(horizontal: false, vertical: true)

            if let deleteError {
                Spacer().frame(height: Spacing.s3)
                HStack { Spacer(); GFTag(label: deleteError.uppercased(), severity: .red); Spacer() }
            }

            Spacer().frame(height: Spacing.s4)

            GFButton(
                label: isDeleting ? "DELETING…" : "DELETE ACCOUNT",
                style: .ghost,
                isDisabled: isDeleting
            ) {
                showingDeleteConfirm = true
            }
        }
    }
    .alert("Delete account?", isPresented: $showingDeleteConfirm) {
        Button("Cancel", role: .cancel) {}
        Button("Delete", role: .destructive) {
            Task { await deleteAccount() }
        }
    } message: {
        Text("All your contracts and scan history will be permanently erased. This cannot be undone.")
    }
}

private func deleteAccount() async {
    guard !isDeleting else { return }
    deleteError = nil
    isDeleting = true
    defer { isDeleting = false }

    do {
        guard let token = await session.currentAccessToken() else {
            throw APIError.unauthenticated
        }
        try await APIClient.shared.deleteAccount(token: token)
        await session.signOut()  // already clears keychain
    } catch APIError.unauthenticated {
        await session.signOut()
    } catch {
        deleteError = error.localizedDescription
    }
}
```

You must add to `APIClient`:
```swift
extension APIClient {
    /// DELETE /api/account — removes the user + cascades all contracts.
    func deleteAccount(token: String) async throws
}
```

### Task 8 — Server-side `DELETE /api/account`

Create `landing/app/api/account/route.ts`:

```ts
import { NextResponse } from "next/server";
import { getSupabaseFromRequest, getSupabaseServiceRole } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE() {
  const supabase = await getSupabaseFromRequest();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Best-effort: drop the user's storage objects first. RLS cascade on
  // the contracts table will handle row deletion when we delete the auth
  // user below.
  const prefix = `${user.id}/`;
  const { data: files } = await supabase.storage.from("contracts").list(prefix, { limit: 5000 });
  if (files && files.length) {
    const paths = files.map(f => `${prefix}${f.name}`);
    await supabase.storage.from("contracts").remove(paths);
  }

  // Delete the auth user. Requires service role — RLS doesn't cover
  // auth.users. Cascade on FK from contracts.owner_id will sweep rows.
  const admin = getSupabaseServiceRole();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
```

Verify on the Supabase side that:
- `contracts.owner_id` has `ON DELETE CASCADE` to `auth.users.id`.
- `scans.contract_id` cascades from `contracts`.
- `usage_events.user_id` cascades.
- `subscriptions.user_id` cascades.

If any FK is missing the cascade, either add a migration in `landing/supabase/migrations/` or manually `.delete()` those rows before deleting the auth user. **Don't ship this without confirming cascades — orphaned rows will RLS-block future users with the same email.**

### Task 9 — Section ordering

Final `SettingsView.body`'s `VStack` order:
```
header
accountSection
appearanceSection
billingSection
aboutSection
supportSection        ← new
sessionSection
dangerZoneSection     ← new
```

## Constraints

- Stay on `main`.
- Don't introduce a third-party form library.
- The mailto URL must escape `body` correctly — `URLComponents` handles it.
- The Delete Account flow must clear keychain — `session.signOut()` already does this, but verify the implementation actually calls `KeychainAuthStorage.clear()` or equivalent before relying on it.
- Service role key stays server-side. Never log it.

## Done when

- [ ] `GFDropdown.swift` exists.
- [ ] Settings account type, appearance, and country (already a `Picker(.menu)`) all share the dropdown chrome — country can either swap to `GFDropdown` or stay (it's already identical inline; either is fine).
- [ ] Onboarding step 1 uses the dropdown.
- [ ] `RadioCard` / `RadioIndicator` deleted from `OnboardingFlow.swift`.
- [ ] Terms/Privacy URLs in Settings point at `greenflagged.xyz`.
- [ ] Settings has Support and Danger Zone sections at the right position.
- [ ] `APIClient.deleteAccount` works against `/api/account`.
- [ ] `landing/app/api/account/route.ts` exists and deletes the user via service role with cascade.
- [ ] Sign-out after delete clears keychain and lands on sign-in.
- [ ] Build passes; manual smoke on a throwaway account works.

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

Manual smoke on a throwaway Supabase account (don't delete Roman's real account!):
1. Sign in with the throwaway → Settings → see account/appearance dropdowns.
2. Tap PRIVACY → opens `greenflagged.xyz/privacy`.
3. EMAIL US → opens Mail compose to `hello@greenflagged.xyz`.
4. SEND A QUERY → opens Mail compose with prefilled subject + device metadata body.
5. DELETE ACCOUNT → confirm → app returns to sign-in.
6. Try signing back in with the same email → server doesn't recognize it → user creates a fresh account flow.
7. Re-run onboarding → account-type is now a dropdown.

## Out of scope

- Replacing the `Picker(.menu)` country chrome inline with `GFDropdown` (optional polish; ok to leave inline since it's visually identical).
- Wiring MANAGE BILLING — Prompt 7 owns that.
- In-app support chat — mailto is the bar for this prompt.
- Email + password account recovery flows — Supabase OAuth-only by design.

