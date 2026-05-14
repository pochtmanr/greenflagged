# iOS kickoff prompt — paste this into a fresh Claude Code session

You are building the **Green Flagged** iOS app from scratch.

## Working directory
`/Users/romanpochtman/Developer/ContractChecker/ios`

## Read these BEFORE writing any code (in order)
1. `../README.md` — monorepo overview
2. `../AGENTS.md` — global rules
3. `../claude/ios/architecture.md` — module layout, dependencies, conventions
4. `../claude/ios/screens.md` — screen-by-screen spec
5. `../claude/ios/billing-iap.md` — StoreKit 2 + server reconciliation
6. `../claude/api/contracts.md` — every endpoint the app hits
7. `../claude/api/bearer-auth.md` — landing/ change required for mobile JWT auth
8. `../claude/design/tokens.md` — colors, type, spacing, components

Also query MemPalace before any UI work:
```
mempalace_search wing="greenflagged" room="design" query="<topic>"
```

## What to build
A native SwiftUI iOS app, **iOS 26 deployment target**, Xcode 16, Swift 6.
Same brand, same data, same verdict logic as the web (`https://flag.red`).

Brand identity (non-negotiable):
- Sage green `#4A7A5C` primary. Dark `#121212` bg. Sharp 2px corners everywhere.
- Inter for body, JetBrains Mono for labels. UPPERCASE mono micro-labels.
- No glass, no blur, no Liquid Glass. Brand is sharp/flat.
- Green is the only decorative color. Yellow/orange/red are severity signals only.

## Stack
- SwiftUI, `@Observable` macro, NavigationStack
- `supabase-swift` (SPM) for auth + direct Supabase reads (RLS-protected)
- StoreKit 2 for billing
- VisionKit for paper scanning
- `swift-markdown-ui` (SPM) for verdict markdown
- **No** Combine, **no** ObservableObject, **no** CocoaPods, **no** third-party state lib

## Backend
- **Supabase project ref:** `pwvtjuklkfelpxzxjmsi`
  URL: `https://pwvtjuklkfelpxzxjmsi.supabase.co`
- **API base:** `https://flag.red` (prod), `http://127.0.0.1:3000` (debug)
- iOS authenticates with Supabase, then sends `Authorization: Bearer <access_token>`
  on every landing/ API call.
- All AI provider keys stay server-side. Never ship Anthropic/OpenAI keys to mobile.

## Phased build (commit after each)

### Phase 1 — scaffolding
1. `xcodebuild -create-xcframework` workflow not needed — just `File → New → Project` in Xcode 16, App template, SwiftUI, Swift, iOS 26 minimum, bundle id `xyz.flag.green`, team = Roman's personal team.
2. Add SPM deps: `supabase-swift` (2.x).
3. Create folder layout from `claude/ios/architecture.md`. Empty Swift files with `// TODO` are fine — establish the skeleton first.
4. Read `Secrets.xcconfig` (gitignored) for `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `API_BASE_URL`. Provide a `Secrets.xcconfig.example` checked in.
5. `Design/` module: `Color+GF.swift`, `Font+GF.swift`, `Spacing.swift`, `GFButton`, `GFCard`, `GFFrame`, `GFTag`, `GFSpecRow`, `GFInput`. Match every token in `claude/design/tokens.md` exactly. Include `#Preview` blocks.
6. Register Inter + JetBrains Mono OTFs (download from Google Fonts). Add via `UIAppFonts` in Info.plist.
7. App skeleton: `GreenFlaggedApp` → `RootView` (wordmark only) → empty placeholder.
8. Verify: project builds, simulator opens with wordmark on `Color.gf.bg`.

### Phase 2 — auth + onboarding
- `Core/Session.swift` `@Observable` with bootstrap, sign-in/up/out, Keychain persistence.
- `Features/Auth/SignInView.swift` — email/password + Google OAuth via `ASWebAuthenticationSession`.
- `Features/Onboarding/OnboardingFlow.swift` — 3 steps mirroring `landing/app/(app)/onboarding/page.tsx`. Writes via Supabase SDK.
- URL scheme `greenflagged://` registered for OAuth callback.

### Phase 3 — dashboard + contracts list
- Tab shell: Dashboard · Scan · Contracts · Settings.
- `DashboardView` with greeting, quick actions, usage meter, recent contracts.
- `ContractsListView` with filter chips, pull-to-refresh.
- Both read directly from Supabase (RLS-safe).

### Phase 4 — scan flow
- `ScanView` with 3 modes: upload (.fileImporter), paste (TextEditor), scan paper (VNDocumentCameraViewController).
- POST multipart to `{API_BASE_URL}/api/scan` with Bearer.
- State machine: idle → ready → uploading → reviewing → done(contractId).
- 402 quota → present `PaywallSheet`.
- 502 ai_failed → toast + retry.
- **Backend prerequisite:** Roman/another agent must land the `bearer-auth.md` change in `landing/lib/supabase/server.ts` and `landing/proxy.ts` before this phase ships. If it's not there yet, do it as part of this phase (small additive change).

### Phase 5 — verdict screen
- `VerdictView` rendering severity stripe, taxonomy spec rows, redlines, markdown.
- Share/Export PDF via `GET /api/contracts/[id]/pdf` + `ShareLink`.

### Phase 6 — billing (StoreKit 2)
- App Store Connect: create products `gf.payg.credit.1` ($3.99 consumable) and `gf.standard.monthly` ($28.99 auto-renewable).
- `BillingService` (see `claude/ios/billing-iap.md`).
- `BillingView` + `PaywallSheet`.
- New server endpoints `POST /api/billing/apple/webhook` and `/api/billing/apple/notifications` in `landing/` — implement per `claude/ios/billing-iap.md`.
- DB migration `landing/supabase/migrations/0012_apple_iap.sql` to add provider/Apple columns. Apply via Supabase dashboard SQL editor.

### Phase 7 — polish + submission
- Universal Links (`flag.red/contracts/{id}` → `VerdictView`).
- APNs for renewal failures (Supabase Edge Function).
- Screenshots, privacy nutrition label, App Store metadata.
- TestFlight internal → external → submit.

## Hard rules
1. **All commits on `main`.** No branches, no PRs. Same workflow as `landing/`.
2. **iOS 26 deployment target.** No iOS 17/18/25 fallback.
3. **Never hardcode** Supabase keys, URLs, or product IDs. Read from `Secrets.xcconfig`. Fail explicitly.
4. **No AI provider keys on the device.** Ever.
5. **Brand color is sage green `#4A7A5C`.** If you need another color, it's a severity signal (yellow/orange/red).
6. **2px corners, UPPERCASE mono labels.** No rounded blobs. No SF default look.
7. **Save material design or architecture decisions to MemPalace** wing=greenflagged room=design after they're made.

## First action
Start Phase 1. After scaffolding builds clean on the iOS 26 simulator, commit
on `main` with a single message describing what landed. Then proceed to Phase 2.

If anything in the spec is ambiguous, **read the source web component first**
(`landing/components/...`) to see how the web does it — match the behaviour,
then translate the visuals via `claude/design/tokens.md`.
