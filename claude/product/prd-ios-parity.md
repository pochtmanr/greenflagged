# PRD — Green Flagged iOS feature parity + monetization

**Status:** Draft v1 — 2026-05-25
**Owner:** Roman (founder / eng)
**Target release:** Rolling, by stream

---

## 1. Background

`landing/` (Next.js 16 web app) ships the full Green Flagged product surface today. `ios/` (Swift 6 / SwiftUI / iOS 26) ships a subset: sign-in, scan, contracts list, contract detail (basic), draft wizard, settings (basic). The first user-visible bug (AI scan reports "could not connect to server") is operational (local dev server not running) — but it surfaced a deeper truth: the iOS app has roughly **40% of the web's functional surface**, with notable gaps in business profile management, branded contract styling, multiple AI editing flows, billing, and the verdict screen polish. There is also no monetization on iOS, so any acquisition through the App Store cannot convert to revenue.

This PRD captures the full scope to bring iOS to functional parity with web (where mobile-appropriate) and to ship a paid tier via App Store IAP routed through RevenueCat.

## 2. Goals

1. **Resolve the reported AI connectivity failure** with both an immediate operational fix and a self-diagnosing error in Debug builds.
2. **Bring iOS to ≥ 90% functional parity** with the web product surface across: contract editing AI flows, business profile management, client management, branded styling, multi-language export, version history, and DOCX export.
3. **Ship monetization on iOS** — Apple IAP via RevenueCat, with Standard subscription ($28.99/mo, 10 contracts) and PAYG credits ($3.99 per credit, 90-day validity) writing into the same Supabase tables the web's Revolut/OxaPay flow already uses.
4. **Maintain the design system contract** — every new surface uses `GFCard`/`GFButton`/`GFFrame`/`GFTag`/`GFInput`/`GFSpecRow` and respects `claude/design/tokens.md` (dark `#121212`, sharp 2px corners, UPPERCASE mono labels in JetBrains Mono, Inter body, green-only decorative color, severity colors are signals).
5. **Self-diagnose common dev/prod misconfigurations** so future "could not connect" issues report what's actually wrong.

## 3. Non-goals

- Rewriting the web Revolut/OxaPay flow. It keeps working unchanged.
- Web parity for iOS-only flows (StoreKit purchases, RevenueCat).
- Marketing surfaces (`/check`, `/blog`, `/pricing`, `/(legal)/*`). Web stays the source of truth.
- Anonymous `/scan/preview` on iOS (iOS users are always signed in via Supabase Apple/Google OAuth).
- Web Realtime / live collaboration on contract editing.
- Server-side streaming SSE for draft generation on iOS (the non-stream `/api/contracts/draft` already works).

## 4. User stories

### 4.1 Existing user, frustrated by the AI error
> "I tried to scan a contract and got 'could not connect to server'. I have my API keys set up in the web app's `.env` — what's wrong?"

**Acceptance:** In Debug builds, the error message is replaced with `"DEV SERVER UNREACHABLE · CHECK pnpm dev IN landing/"`. README explicitly documents this as the first thing to check.

### 4.2 Returning user, looking for past contracts
> "I scanned some contracts last week — where do I find them?"

**Acceptance:** The Contracts tab (already wired in `MainTabsView`) shows all scans with severity, kind, and date. Tapping opens the new Verdict screen.

### 4.3 Freelancer drafting a branded contract on the go
> "I'm at a client meeting on my iPhone. I want to draft an NDA, attach my business logo, and email a branded PDF before I leave."

**Acceptance:**
- Draft wizard creates contract.
- Business Profiles section in Settings lets me create my profile with logo (upload from Photos).
- Style picker on the contract detail screen lets me choose typography, layout, accent color, logo placement.
- Export → branded PDF with my logo + company info in header.
- Share via iOS share sheet (Mail, AirDrop, Files).

### 4.4 User scanned a contract, wants to fix the issues
> "The verdict has 5 redlines. Can the AI just fix them all and give me a redlined version I can send back?"

**Acceptance:** Verdict screen has "GENERATE FIX" CTA → calls `/api/contracts/[id]/fix` → navigates to the new drafted contract with `kind='drafted'` and `source_contract_id` set. User can then tweak, restyle, and export.

### 4.5 User running out of free quota
> "I've already scanned one contract this month. Can I scan another?"

**Acceptance:** Second scan attempt returns 402 → paywall (`BillingPaywallView`) presents Standard ($28.99/mo) and PAYG ($3.99/credit). Purchase via Apple ID → entitlement reflected immediately via RevenueCat. Subsequent scan proceeds.

### 4.6 User wants their contract in German
> "I drafted in English but need to send it in German."

**Acceptance:** Contract detail → "TRANSLATE" → picker shows supported locales (en, es, fr, de, it, pt, nl, pl, ja, zh) → German version generated and cached. Subsequent exports default to the chosen locale.

### 4.7 User wants to manage multiple clients
> "I have three regular clients I draft contracts for. I want their info pre-filled."

**Acceptance:** Settings → Clients → CRUD list. When drafting, a client picker autofills counterparty fields.

### 4.8 User wants to delete their account
> "I want to remove all my data."

**Acceptance:** Settings → Danger Zone → Delete account flow with explicit confirmation. Deletes Supabase row + storage objects. App returns to signed-out state.

## 5. Functional requirements

Numbered per area for traceability into stream prompts.

### 5.1 Connectivity & AI parity (Stream A)

- 5.1.1 `/api/health` endpoint returns `{ok:true}` with no auth.
- 5.1.2 iOS Debug builds detect `URLError` codes -1004 / -1001 / -1003 and substitute `"DEV SERVER UNREACHABLE · CHECK pnpm dev IN landing/"` for transport errors.
- 5.1.3 Backend routes `improve`, `tweak`, `fix`, `translate`, `versions` accept Bearer JWT in addition to cookie auth. **[DONE]**
- 5.1.4 iOS `APIClient` exposes `improve`, `tweak`, `fix`, `translate`, `createVersion`, `cloneContract`.
- 5.1.5 Draft wizard `improveTextareaControl` calls `improve` and replaces the field value.
- 5.1.6 Contract detail exposes "TWEAK" sheet (instruction → preview → accept → createVersion).
- 5.1.7 Scanned contract detail exposes "GENERATE FIX" → navigates to the new drafted contract.

### 5.2 Billing (Stream B)

- 5.2.1 Supabase schema: `provider` column added to `subscriptions`, `payments`. `apple_original_transaction_id`/`apple_product_id` on `subscriptions`. `apple_transaction_id` unique on `payments`/`credits`.
- 5.2.2 RPCs `claim_apple_subscription` and `claim_apple_payg` are SECURITY DEFINER, idempotent, and reject on transaction-ID conflict between users.
- 5.2.3 Webhook `/api/billing/revenuecat/webhook` verifies `Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>` and handles 8 RevenueCat event types idempotently.
- 5.2.4 iOS includes RevenueCat SDK ≥ 5.0.
- 5.2.5 `Purchases.configure` runs at app launch; `logIn(supabaseUserId)` runs on auth state change.
- 5.2.6 `BillingPaywallView` (fullScreenCover) lists Standard + PAYG packages from RevenueCat Offerings; includes Restore Purchases.
- 5.2.7 `EntitlementGate` exposes `isStandard` and `creditsRemaining`, reads from Supabase + RC.
- 5.2.8 Dashboard and Settings show real plan tier (not hardcoded `FREE`).
- 5.2.9 Scan/Draft on 402 `quota_exceeded` present the paywall.
- 5.2.10 Sandbox renewal updates `subscriptions.period_end` via webhook with app closed.

### 5.3 Verdict screen + DOCX + version history + translate UI (Stream C)

- 5.3.1 `VerdictView` renders severity hero stripe, title, taxonomy chips, redlines (expandable), full verdict markdown, source toggle, footer actions (PDF, Report PDF, Generate Fix).
- 5.3.2 Markdown is rendered (not raw) via `AttributedString(markdown:)`.
- 5.3.3 Backend `/api/contracts/[id]/docx` accepts Bearer.
- 5.3.4 iOS `APIClient.docx(contractId:locale:token:)` returns a temp file URL.
- 5.3.5 Contract detail exposes "DOWNLOAD .DOCX" with iOS share sheet.
- 5.3.6 Contract detail has "HISTORY" sheet listing `contract_versions` rows; each row → preview → restore (POST `/api/contracts/[id]/versions` with the old body).
- 5.3.7 Contract detail (drafted only) has "TRANSLATE" picker (10 locales) → calls translate → updates displayed body + remembers preference for export.
- 5.3.8 `Models/Taxonomy.swift` finalized per `claude/ios/screens.md`.
- 5.3.9 Empty state of `ContractsListView` nudges users to the Scan tab.

### 5.4 Business profiles + Clients (Stream D)

- 5.4.1 Backend `/api/business-profiles` and `/api/business-profiles/[id]` (POST/PATCH/DELETE), `/api/business-profiles/[id]/logo` (POST) accept Bearer.
- 5.4.2 Backend `/api/clients` and `/api/clients/[id]` (POST/PATCH/DELETE) accept Bearer.
- 5.4.3 iOS `BusinessProfile`, `Client` models match Supabase schema.
- 5.4.4 iOS `BusinessProfilesView` (Settings → Business): list with logo thumbnails, default badge, create/edit/delete, set-default.
- 5.4.5 iOS `BusinessProfileEditView`: all fields per web spec (first_name, family_name, business_name, label, tax_id, email, phone, website, country, city, street, postal). Country picker reuses `AddressCountry.options` from `QuestionField.swift`.
- 5.4.6 iOS logo upload: `PhotosPicker` → image cropped to ≤ 500 KB → POST `/api/business-profiles/[id]/logo` → signed URL displayed.
- 5.4.7 iOS `ClientsView` (Settings → Clients): same CRUD shape; no logo.
- 5.4.8 Draft wizard adds a `BusinessProfile` and `Client` picker (or uses defaults if set).

### 5.5 Branded contract styling + contract editor (Stream E)

- 5.5.1 iOS `ContractStyle` Codable type matching `lib/pdf/themes.ts`: `typography` (editorial/modern/classic), `accent` (ink/brand), `layout` (single/two-column/cover), `logo_placement` (header/header_with_info/cover/none), `brand_color` optional hex.
- 5.5.2 iOS `StyleSidebarView` (sheet or inspector on Contract Detail) with native pickers for each field + `ColorPicker` for brand color.
- 5.5.3 Saving the style calls `POST /api/contracts/[id]/versions` with the `style` payload (existing route handles it).
- 5.5.4 iOS contract editor (drafted only): `TextEditor` for `body_md` with manual save → POST `/api/contracts/[id]/versions`.
- 5.5.5 iOS preview: lightweight `StyledMarkdownPreview` (SwiftUI) approximating the web's preview — applies the resolved typography font, brand color, logo at chosen placement.
- 5.5.6 BusinessProfile picker in contract editor.
- 5.5.7 Save state: `idle | saving | saved` with last-saved timestamp.

### 5.6 Clone, account deletion, contact, polish (Stream F)

- 5.6.1 Backend `/api/contracts/[id]/clone` accepts Bearer.
- 5.6.2 iOS Contract detail has "CLONE" action → calls clone → navigates to the new contract.
- 5.6.3 iOS Settings → Danger Zone → "DELETE ACCOUNT" — explicit two-tap confirmation. Calls Supabase `delete_user()` RPC (create if absent) or admin endpoint. Signs out and dismisses.
- 5.6.4 iOS Settings → "CONTACT SUPPORT" — deep-links to `mailto:hello@greenflagged.xyz` or presents an in-app form posting to `/api/contact` (which is unauthenticated).
- 5.6.5 Confirm `/onboarding` parity: account type, country, industries. (Pre-existing; verify nothing missing.)
- 5.6.6 Error path polish: every screen surfaces a `GFFrame(bracketColor: .sevRed)` with mono uppercase reason on failure.

## 6. Dependencies

- **Stream B → 5.2.x**: Roman must complete App Store Connect + RevenueCat dashboard setup per plan §6 before Stream B iOS code can run. Webhook secret + API key must land in env files.
- **Stream C → 5.3.7**: Translate UI needs Stream A's `translate` APIClient method (Stream A's `5.1.4`). If A merges first, C consumes it; otherwise C ships a hidden stub.
- **Stream E → 5.5.3**: Style payload writes use the `versions` route (Stream A's `5.1.3` Bearer swap, already done).
- **Stream F → 5.6.1**: Clone route needs a Bearer swap, included in Stream F's backend scope.
- **All streams**: Stream A's backend Bearer swaps are merged into `main` already (this session). Other streams can assume Bearer works on `scan`, `draft`, `improve`, `tweak`, `fix`, `translate`, `versions`, `[id]` GET/DELETE, `pdf`, `report/pdf`.

## 7. Risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| RevenueCat sandbox flakiness during testing | Medium | Medium | Keep client-side RPC as authoritative for in-app state; webhook reconciles asynchronously. |
| Apple IAP product rejection (naming, descriptions) | Medium | High (blocks revenue) | Follow App Store guidelines closely; use sandbox tester before submit. |
| Branded PDF preview rendering mismatches web @react-pdf output | High | Low | iOS preview is intentionally an approximation; canonical render stays server-side. Ship clear "PREVIEW IS APPROXIMATE — DOWNLOAD FOR FINAL" label. |
| Logo upload payload exceeds 500 KB after iOS Photos compression | Medium | Low | Apply on-device JPEG compression at quality 0.6 with downscale to max 1024×1024 before POST. |
| Schema migration on `subscriptions`/`payments` breaks existing Revolut rows | Low | High | Default `provider='revolut'` so existing rows valid. Check constraint applied AFTER backfill. |
| Stream merge conflicts on shared files (`APIClient.swift`, `ContractDetailView.swift`) | High | Medium | Streams A/C/D/E/F may all touch `APIClient.swift` — merge as soon as each stream finishes; shape the methods so each is an `extension APIClient` block. |


## 8. Success metrics

- All 12 verification steps from plan §7 pass against a real iOS Debug build.
- iOS Crashlytics (if wired) shows zero AppConfig-related crashes 7 days post-release.
- ≥ 1 sandbox-tester purchase round-trips a `subscriptions` row with `provider='apple'`.
- Time-to-first-scan from app open ≤ 30 seconds on a fresh install.
- DOCX/PDF export ≥ 95% success rate over 100 trials.

## 9. Release plan

Each stream is a worktree off `main` that merges back to `main` immediately on completion (`AGENTS.md` HARD RULE). Order:

```
Stream A — partially complete (backend Bearer swaps merged this session)
   ↓ iOS-side wrap-up
Stream D ──┐
Stream C ──┼─ all three runnable in parallel after A's iOS wrap lands
Stream E ──┘
   ↓
Stream B (after Roman finishes ASC + RC dashboard setup; can start in parallel with C/D/E)
   ↓
Stream F (polish; depends on D and E for the editor/profile surfaces)
```

Target: all streams merged within 2 weeks of plan approval.

## 10. Open questions


- **Localization scope**: web supports en/es/fr/de/it/pt/nl/pl/ja/zh for translate; iOS Settings should hold a default-export-locale preference. Should iOS auto-detect from device locale?
- **Logo file format**: web accepts PNG/JPG/SVG. iOS `PhotosPicker` won't return SVG natively. Drop SVG on iOS, or add a Files import for SVG?
- **Account deletion endpoint**: is there an existing server endpoint, or do we need to add one (e.g., `POST /api/account/delete` calling the Supabase admin API with the service role key)?
- **Onboarding parity**: confirm with a quick diff whether iOS `OnboardingFlow` covers everything the web `/onboarding` collects.
