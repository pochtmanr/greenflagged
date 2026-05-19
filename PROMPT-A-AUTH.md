# PROMPT A — iOS auth foundation

**Working directory:** `/Users/romanpochtman/Developer/ContractChecker/ios/Green Flagged/`
**Suggested agent:** `swift-ui-architect`
**Depends on:** nothing — can run from t=0
**Blocks:** Prompt C

---

## Read first

- `AGENTS.md` (project rules — git stays on `main`, no branches, no hardcoded secrets)
- `claude/ios/architecture.md` (module layout)
- `claude/design/tokens.md` (current iOS token mapping)
- `Design/Color+GF.swift`, `Design/Font+GF.swift`, existing `GFButton` / `GFFrame` / `Wordmark` components

## Goal

Replace the dev-stub `Session` with a real Supabase auth foundation. **Sign in with Apple + Google OAuth, no email/password, no magic link.** Custom Keychain storage for tokens. Onboarding gate is wired but its body is a stub (Prompt C replaces it).

## Tasks

1. **Add SPM dep `supabase-swift`** — `https://github.com/supabase/supabase-swift`, latest stable, product `Supabase`. Edit `Green Flagged.xcodeproj/project.pbxproj` (or use Xcode `swift package` integration). Project uses synchronized groups; adding files to the file system under `Green Flagged/` auto-includes them.
2. **Create `Core/KeychainAuthStorage.swift`** conforming to supabase-swift's `AuthLocalStorage` protocol. Use the iOS Keychain Services API (`SecItemAdd` etc.). Service `xyz.flag.green.auth`, account `supabase.session`. The existing `KeychainStore` (under `Core/`) can be reused or extended — read it first.
3. **Rewrite `Core/Supabase.swift`** to expose a single `SupabaseClient` factory backed by `AppConfig.supabaseURL` / `AppConfig.supabaseAnonKey` and `KeychainAuthStorage`. Fail loudly if config is missing (no fallback defaults — `AGENTS.md` rule).
4. **Rewrite `Core/Session.swift`** as `@MainActor @Observable final class Session` with:
   - `var authState: AuthState` enum:
     - `.loading`
     - `.signedOut`
     - `.needsOnboarding(user: User)`
     - `.signedIn(user: User, profile: Profile)`
   - `bootstrap() async` — restores session from Keychain via supabase-swift, then calls `refreshProfile()`.
   - `signInWithApple() async throws` — uses `AuthenticationServices` `ASAuthorizationAppleIDProvider`, generates a cryptographic nonce, captures `identityToken`, calls `supabase.auth.signInWithIdToken(credentials: .init(provider: .apple, idToken: ..., nonce: rawNonce))`. After success: `await refreshProfile()`.
   - `signInWithGoogle() async throws` — uses `supabase.auth.signInWithOAuth(provider: .google, redirectTo: URL(string: "xyz.flag.green://auth/callback"))` and `ASWebAuthenticationSession`. supabase-swift exposes a helper; if needed, use `webAuthenticationSession` env value. After success: `await refreshProfile()`.
   - `signOut() async` — `try? await supabase.auth.signOut()`, set state to `.signedOut`.
   - `currentAccessToken() async throws -> String` — `try await supabase.auth.session.accessToken` (auto-refreshes).
   - `refreshProfile() async` — queries `profiles` row for current user (`supabase.from("profiles").select().eq("user_id", user.id).maybeSingle()`). If row missing or `onboarded_at == nil` → `.needsOnboarding(user)`. Else → `.signedIn(user, profile)`.
5. **Build `Features/Auth/SignInView.swift`** per design tokens:
   - Centered `Wordmark` near top.
   - Vertical stack of two `GFButton`s with `Spacing.s3` between them: Apple (solid style, label `"CONTINUE WITH APPLE"`, leading SF Symbol `applelogo`), Google (ghost style, label `"CONTINUE WITH GOOGLE"`).
   - Tiny mono disclaimer under buttons: `"BY CONTINUING YOU AGREE TO TERMS & PRIVACY."` styled with `Font.gf.label` and `Color.gf.fg3`.
   - Tap states: show inline spinner replacing button label while signing in.
   - Errors: catch and surface via a `GFTag(message, severity: .red)` row above the disclaimer; clear on next tap.
6. **Update `App/RootView.swift`** to switch on `session.authState`:
   - `.loading` → `Wordmark()`
   - `.signedOut` → `SignInView()`
   - `.needsOnboarding` → `OnboardingFlow()` (create as a stub view file at `Features/Onboarding/OnboardingFlow.swift` showing `Text("ONBOARDING — PROMPT C").font(.gf.label)` — Prompt C will replace its body).
   - `.signedIn` → `MainTabsView()`
7. **Info.plist** — add `CFBundleURLTypes` with scheme `xyz.flag.green`. The file is at `Green Flagged/Info.plist` if it exists, otherwise the project uses the auto-generated one — in that case add `INFOPLIST_KEY_CFBundleURLTypes` to build settings or create an Info.plist override. Verify by building.
8. **Build clean** — `xcodebuild -project "Green Flagged.xcodeproj" -scheme "Green Flagged" -destination "platform=iOS Simulator,name=iPhone 16" build` or via Xcode. Iterate until zero errors and zero warnings (warnings about `Sendable` from supabase-swift are acceptable).

## Constraints

- Never hardcode `SUPABASE_URL` / `SUPABASE_ANON_KEY`. Read from `AppConfig`. Fail loudly if missing.
- Match existing design: use `GFButton`, `GFFrame`, `Color.gf.*`, `Font.gf.*`. Do not introduce new colors or new components.
- No email/password fields anywhere. No magic-link flow.
- Out of scope: actual data fetching (Prompt C), theme toggle (Prompt B), real `OnboardingFlow` body (Prompt C), `SettingsView` edits (Prompt C).
- **Do not touch `Features/Settings/SettingsView.swift`** — Prompt C owns that file in this wave.
- Git: stay on `main`. No branches, no PRs.

## Verification

1. App compiles clean for iOS 26 / iPhone 16 simulator.
2. Launching shows `Wordmark` (during `.loading` bootstrap) then `SignInView`.
3. Tapping Apple opens the native Apple Sign-In sheet (simulator may fail to complete without a real Apple ID — log the error path, don't break).
4. Tapping Google opens an `ASWebAuthenticationSession` browser sheet pointed at Supabase's `/auth/v1/authorize?provider=google&...`.
5. Sign-out path: calling `session.signOut()` from anywhere returns state to `.signedOut`.
6. `grep -n "dev-stub" "Green Flagged/Core/Session.swift"` returns empty (the dev stub is gone).

## Out of scope for this prompt

- Data wiring (Dashboard / Contracts / Settings) — Prompt C
- Onboarding wizard body — Prompt C
- Theme toggle / light mode — Prompt B
- StoreKit / IAP, API calls to `/api/scan` etc. — future session
