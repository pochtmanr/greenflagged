# iOS — architecture

Native SwiftUI app, iOS 26+, Xcode 16, Swift 6. Same brand, same data, same
verdict logic as the web — but rebuilt as a first-class iOS experience.

## Stack

- **SwiftUI** — full app, no UIKit except where Apple still forces it (`VisionKit`).
- **`@Observable`** macro for view models. No Combine. No `ObservableObject`.
- **NavigationStack** with value-routed destinations.
- **`supabase-swift`** for auth + RLS-protected reads.
- **StoreKit 2** for billing.
- **VisionKit** `VNDocumentCameraViewController` for paper-scan to PDF.
- **`swift-markdown-ui`** (1.x) for verdict markdown rendering, OR
  AttributedString + a small custom renderer if we want zero deps. Decide in
  Phase 5.
- **No GSAP equivalent.** Use SwiftUI's built-in `.transition`, `.animation`,
  `withAnimation`. Brand is sharp/flat, motion is restrained.
- **No third-party state lib.** Apple's primitives carry this app's complexity.

## Module / folder layout

```
ios/
├── GreenFlagged.xcodeproj
├── GreenFlagged/                          # app target
│   ├── App/
│   │   ├── GreenFlaggedApp.swift          # @main
│   │   ├── RootView.swift                 # auth gate → onboarding or tabs
│   │   └── AppRouter.swift                # @Observable, holds NavigationPath per tab
│   ├── Core/
│   │   ├── Supabase.swift                 # shared SupabaseClient (URL+anonKey from xcconfig)
│   │   ├── APIClient.swift                # landing/ JSON+multipart client, Bearer token injected
│   │   ├── Session.swift                  # @Observable, holds current user + token + profile
│   │   ├── KeychainStore.swift            # refresh-token persistence
│   │   ├── Errors.swift                   # GFError enum with .quotaExceeded, .network, etc.
│   │   └── Telemetry.swift                # log facade (OSLog category=GF)
│   ├── Models/
│   │   ├── Profile.swift
│   │   ├── Contract.swift                 # id, title, kind, industry, severity, createdAt
│   │   ├── Scan.swift                     # taxonomy, verdictMd, redlines
│   │   ├── Verdict.swift                  # Severity enum + labels
│   │   ├── Taxonomy.swift                 # enum with localized label
│   │   ├── Plan.swift                     # free/standard + quota math
│   │   └── UsageEvent.swift
│   ├── Features/
│   │   ├── Auth/
│   │   │   ├── SignInView.swift
│   │   │   ├── SignUpView.swift
│   │   │   ├── ResetPasswordView.swift
│   │   │   └── GoogleSignInService.swift  # ASWebAuthenticationSession
│   │   ├── Onboarding/
│   │   │   ├── OnboardingFlow.swift       # 3 steps: type → country → business
│   │   │   └── OnboardingViewModel.swift
│   │   ├── Dashboard/
│   │   │   ├── DashboardView.swift
│   │   │   ├── DashboardViewModel.swift
│   │   │   ├── UsageMeter.swift
│   │   │   └── QuickActions.swift
│   │   ├── Scan/
│   │   │   ├── ScanView.swift             # upload | paste | camera tabs
│   │   │   ├── ScanViewModel.swift        # state machine: idle→reading→uploading→reviewing→done
│   │   │   ├── DocumentPicker.swift       # .fileImporter wrapper
│   │   │   └── DocumentScanner.swift      # VisionKit → PDF
│   │   ├── Verdict/
│   │   │   ├── VerdictView.swift
│   │   │   ├── VerdictHeader.swift        # severity stripe
│   │   │   ├── TaxonomyList.swift         # spec rows
│   │   │   ├── RedlinesList.swift
│   │   │   └── ShareSheet.swift           # PDF export via /api/contracts/[id]/pdf
│   │   ├── Contracts/
│   │   │   ├── ContractsListView.swift
│   │   │   └── ContractRow.swift
│   │   ├── Settings/
│   │   │   ├── SettingsView.swift
│   │   │   ├── ProfileEditor.swift
│   │   │   └── SignOutButton.swift
│   │   └── Billing/
│   │       ├── PaywallSheet.swift         # opens on 402
│   │       ├── BillingView.swift          # /settings/billing equivalent
│   │       ├── BillingService.swift       # StoreKit 2 wrapper
│   │       └── ProductCatalog.swift       # static product IDs
│   ├── Design/
│   │   ├── Color+GF.swift                 # all tokens from claude/design/tokens.md
│   │   ├── Font+GF.swift                  # Inter + JetBrainsMono families
│   │   ├── Spacing.swift
│   │   ├── GFButton.swift
│   │   ├── GFCard.swift
│   │   ├── GFFrame.swift                  # corner brackets
│   │   ├── GFTag.swift
│   │   ├── GFSpecRow.swift
│   │   ├── GFInput.swift                  # styled TextField
│   │   └── Theme.swift                    # @Observable, dark-first
│   └── Resources/
│       ├── Assets.xcassets
│       ├── Fonts/
│       │   ├── Inter-Regular.otf … Inter-Bold.otf
│       │   └── JetBrainsMono-Regular.otf, JetBrainsMono-Medium.otf
│       ├── Info.plist                     # UIAppFonts, URL types, ATS exceptions for localhost
│       └── Localizable.xcstrings          # en + de (later)
├── GreenFlaggedTests/
│   ├── ScanViewModelTests.swift
│   ├── VerdictDecodingTests.swift
│   └── DesignTokensSnapshotTests.swift
├── Secrets.xcconfig.example
└── README.md
```

## Configuration via xcconfig

`Secrets.xcconfig.example` checked in; `Secrets.xcconfig` gitignored.

```
SUPABASE_URL = https:/$()/pwvtjuklkfelpxzxjmsi.supabase.co
SUPABASE_ANON_KEY = sb_publishable_xxx

API_BASE_URL_DEBUG = http:/$()/127.0.0.1:3000
```

`$()` escapes the `//` so xcconfig doesn't treat it as a comment. Read in
`Core/Supabase.swift` and `Core/APIClient.swift`.

## Auth flow

1. App launch → `Session.bootstrap()`
2. Read refresh token from Keychain. If present, call `supabase.auth.refreshSession`.
3. If session valid → load profile from Supabase. If `onboarded_at == nil` → onboarding. Else → main tabs.
4. If no session → SignInView.
5. Sign-in success → write refresh token to Keychain, fetch profile, navigate.
6. Sign-out → wipe Keychain + `Session.user = nil`.

Bearer-token attaching in `APIClient`:
```swift
var request = URLRequest(url: url)
if let token = await session.currentAccessToken() {
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
}
```

`session.currentAccessToken()` auto-refreshes if expired (uses
`supabase.auth.session.accessToken` and the SDK's built-in refresh).

## Navigation

One `AppRouter @Observable` instance, four `NavigationPath`s (one per tab).
Tabs: Dashboard · Scan · Contracts · Settings.


through `onOpenURL` → router push.

## Errors

Single `GFError` enum:
- `.network(URLError)` — generic; surface "Check your connection" toast
- `.unauthorized` — Session refresh failed; route to SignIn
- `.quotaExceeded(paywallURL: String)` — present `PaywallSheet`
- `.upload(reason)` — too big, wrong type
- `.aiFailed` — retry-suggestion toast
- `.server(status: Int, code: String?)` — fallback

No fatal crashes for user-actionable errors. `OSLog` everything to subsystem
`xyz.flag.green` with categories `auth`, `api`, `billing`, `scan`.

## Dependencies (Swift Package Manager only)

- `https://github.com/supabase/supabase-swift` — pin to 2.x
- `https://github.com/apple/swift-collections` — for `OrderedDictionary` (optional)
- `https://github.com/gonzalezreal/swift-markdown-ui` — verdict rendering (decide
  in Phase 5; replaceable with AttributedString)

No CocoaPods. No Carthage.

## Testing

- `XCTest` unit tests for view models and API decoders.
- Snapshot tests (via `swift-snapshot-testing` if added later) for design components.
- One end-to-end test that hits `localhost:3000` `/api/scan` with a fixture PDF —
  gated behind an env var so CI runs offline.

## Build / run

- Debug: `API_BASE_URL_DEBUG` (localhost). Cmd+R from Xcode against the
  iOS 26 simulator.

- CI: GitHub Actions or Xcode Cloud — defer to Phase 7.

## What's NOT in v1

- iPad-specific layouts (works on iPad, but no split view yet)
- watchOS / macOS Catalyst
- Push notifications (Phase 7)
- German localization (Phase 7)
- Contract editing on iOS (read-only verdicts only; web does editing)
- Dark/light theme toggle (dark-only for v1)
