# iOS — screen spec

Every screen has a web counterpart. This doc maps them, names the components
used, lists the API calls, and pins the brand cues.

Routes are NavigationPath values, not URLs. Universal-link URLs in `(parens)`.

---

## 1. Launch → Auth gate

**File:** `App/RootView.swift`

While `Session.bootstrap()` runs, render a centered wordmark `GREEN ◇ FLAGGED`
on `Color.gf.bg`. No spinner.

- Session valid + `profile.onboarded_at != nil` → `MainTabsView`
- Session valid + not onboarded → `OnboardingFlow`
- No session → `SignInView`

---

## 2. SignIn / SignUp / ResetPassword

**Files:** `Features/Auth/SignInView.swift`, `SignUpView.swift`, `ResetPasswordView.swift`

Mirrors `landing/components/sections/sign-in-form.tsx`. Single sheet, mode toggle
inside the form.

Layout (top → bottom):
- `GREEN ◇ FLAGGED` wordmark, 24pt below safe area top
- `GFFrame` containing:
  - `// SIGN IN` or `// SIGN UP` mono label
  - `GFButton("Continue with Google", style: .ghost)` with Google glyph at left
  - "─── OR ───" hairline divider in mono-sm
  - `GFInput(placeholder: "Email")`
  - `GFInput(placeholder: "Password", isSecure: true)`
  - `GFButton("Sign in →", style: .solid)`
  - link row: `Forgot password? · New here? Sign up`
- Footer mono-sm: `Need help? hello@greenflagged.xyz`

**Google flow:** `ASWebAuthenticationSession` against
`{SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=greenflagged://auth/callback`.
URL scheme `greenflagged` registered in Info.plist.

**On success:** Session.set + fetch profile. If `onboarded_at == nil` →
`OnboardingFlow`. Else `MainTabsView`.

**Errors:** inline `gf-mono-sm` text in `Color.gf.sevRed` above the submit button.

---

## 3. Onboarding

**File:** `Features/Onboarding/OnboardingFlow.swift`

3 steps. Mirrors `landing/app/(app)/onboarding/page.tsx`.

### Step 1 — account type
- H2 `// WHO ARE YOU`
- 4 radio cards in 2x2 grid: Freelancer · Agency · Founder · Creator
  - each card is `GFFrame` with icon (SF Symbol) + bold name + 1-line description
  - tap selects, sets `vm.accountType`
- `GFButton("Continue →", style: .solid)` — disabled until selection

### Step 2 — country
- H2 `// WHERE YOU OPERATE`
- `GFInput` styled as a `Picker` (custom popover-style sheet) listing countries
- default = `Locale.current.region?.identifier` mapped to a row
- `GFButton("Continue →", style: .solid)`

### Step 3 — business name (optional)
- only if accountType ∈ {agency, founder}
- H2 `// BUSINESS DETAILS`
- `GFInput(placeholder: "Business name (optional)")`
- `GFButton("Finish →", style: .solid)` writes profile via Supabase SDK, navigates to Dashboard

---

## 4. MainTabsView

**File:** `App/MainTabsView.swift`

`TabView` with 4 tabs. Custom tab bar styled to match the brand (mono labels,
no SF default).

| Tab | Icon (SF Symbol) | Label | Destination |
|---|---|---|---|
| Dashboard | `chart.bar.fill` | `// HOME` | `DashboardView` |
| Scan | `doc.viewfinder` | `// SCAN` | `ScanView` |
| Contracts | `tray.full` | `// CONTRACTS` | `ContractsListView` |
| Settings | `gearshape` | `// SETTINGS` | `SettingsView` |

Tab bar bg is `Color.gf.bg` with a 1px top rule (`Color.gf.rule`).

---

## 5. Dashboard `// HOME`

**File:** `Features/Dashboard/DashboardView.swift`
**Web parity:** `landing/app/(app)/dashboard/page.tsx`

ScrollView (vertical), sections separated by 24pt.

1. **Greeting** — `// HELLO, {first_name or 'GREEN FLAGGER'}` in `Font.gf.label`,
   followed by today's date in `Font.gf.monoSm` color `fg-3`.

2. **Quick actions row** — two `GFFrame` cards side by side:
   - `// SCAN A CONTRACT` + body + `→` arrow → push `ScanView`
   - `// DRAFT A CONTRACT` + body + `→` arrow → push `DraftView` (v1.1; for v1, link out to greenflagged.xyz/contracts/new)  

3. **Usage meter** — `GFCard` with two `GFSpecRow`:
   - `SCANS THIS MONTH ······· 3 / 10`
   - `CREDITS REMAINING ······· 7`
   - tap → `BillingView`

4. **Recent contracts** — list of up to 5 most recent. Each row:
   - severity tag `[OK]` / `[WARN]` / `[HIGH]` / `[CRITICAL]`
   - title
   - relative date in mono-sm
   - tap → `VerdictView(contractId:)`
   - "View all →" link to `ContractsListView` at bottom

**Data:** parallel fetch via Supabase:
- profile (already in Session)
- last 5 contracts
- this-month usage_events count grouped by kind
- subscription + active credits

---

## 6. Scan `// SCAN`

**File:** `Features/Scan/ScanView.swift`
**Web parity:** `landing/app/(app)/scan/page.tsx`

State machine:
```
idle → ready → uploading → reviewing → done(contractId)
        ↑                                  │
        └──────────── error ←──────────────┘
```

Top: H1 `// SCAN A CONTRACT`, sub `gf-body-sm` color `fg-2`.

Mode toggle (3 `gf-btn-link` pills, dim inactive):
- `[ UPLOAD ]`
- `[ PASTE TEXT ]`
- `[ SCAN PAPER ]` (camera)

### Upload mode
Big `GFFrame` (the dropzone). Tap → `.fileImporter` with content types
`[.pdf, .plainText, UTType("org.openxmlformats.wordprocessingml.document")]`.
After pick: filename + size in `GFSpecRow`. Submit button enables.

### Paste mode
`GFInput` rendered as multiline TextEditor inside a `GFFrame`, min height 320pt.

### Scan paper mode
`GFButton("Open camera →", style: .solid)` → present `VNDocumentCameraViewController`
sheet → produces a PDF in temp dir.

### Status row (always visible below mode area)
`GFSpecRow(key: "STATUS", value: ...)` cycles:
- `WAITING FOR FILE`
- `READY · 248 KB`
- `PARSING DOCUMENT…`
- `REVIEWING WITH AI…`
- `DONE` → auto-navigate

Submit: `GFButton("Scan contract →", style: .solid)`. Disabled until ready.

### API call
`POST {API_BASE_URL}/api/scan` with `Authorization: Bearer …`.
- If file: multipart with `file=`
- If text: JSON `{ "text": "…" }`
On 200 → `vm.state = .done(contractId)` → push `VerdictView`.
On 402 → present `PaywallSheet`.
On 502 → toast "AI review failed — try again".

---

## 7. Verdict view

**File:** `Features/Verdict/VerdictView.swift`
**Web parity:** `landing/app/(app)/contracts/[id]/page.tsx`

Navigated to with `contractId`. Fetches contract + scan from Supabase.

Layout (vertical ScrollView):

1. **Header**
   - eyebrow `// VERDICT`
   - H1 = `contract.title`
   - severity stripe: `GFTag(severityLabel(severity), severity: severity)` followed by mono-sm "Reviewed on {date}"

2. **Verdict markdown** — `GFCard` containing rendered `scan.verdict_md`. Markdown renderer: `swift-markdown-ui` with custom theme matching `.legal-body` (paragraph spacing, list bullets, strong = `Color.gf.fg1`).

3. **Taxonomy spec rows** — `GFCard` with `// CLAUSE SUMMARY` label, then one `GFSpecRow` per taxonomy entry:
   - key = `Taxonomy.label`
   - value = `GFTag(shortLabel, severity:)`
   - tap to expand → shows scan.taxonomy[key].notes in body-sm

4. **Redlines** — for each redline:
   - `GFFrame` (with corner brackets) containing:
     - mono-sm label `// REDLINE \(index + 1)`
     - body label `redline.title`
     - "ORIGINAL" → strike-through quote
     - "PROPOSED" → quoted suggestion
     - severity tag if applicable

5. **Action bar** (pinned bottom, sticky):
   - `GFButton("Share / Export PDF", style: .ghost)` → `ShareLink(item: pdfURL)`
   - `GFButton("Done", style: .solid)` → pop to root

### PDF export
On Share tap: fetch `GET /api/contracts/{id}/pdf` with Bearer, save to temp,
present `ShareLink` with `.pdf` content type.

---

## 8. Contracts list `// CONTRACTS`

**File:** `Features/Contracts/ContractsListView.swift`
**Web parity:** `landing/app/(app)/contracts/page.tsx`

- Filter chips at top: `[ ALL · SCANNED · DRAFTED ]` (mono labels, single-select)
- List with `ContractRow` each:
  - severity tag
  - title
  - kind badge (mono-sm `SCANNED` / `DRAFTED`)
  - relative date
- Pull-to-refresh. Infinite scroll (load next 50 at scroll-bottom).
- Empty state: centered `GFFrame` "No contracts yet · Scan your first →"
- Swipe-to-delete? **No** for v1 — read-only on mobile. Web does deletes.

---

## 9. Settings `// SETTINGS`

**File:** `Features/Settings/SettingsView.swift`
**Web parity:** `landing/app/(app)/settings/page.tsx`

Sections (each is a `GFCard`):
1. **Account** — email (read-only), account_type (Picker), country (Picker), business_name (TextField). "Save changes →" button writes via Supabase SDK.
2. **Billing** — current plan tag + "Manage billing →" → `BillingView`.
3. **About** — version string, "Privacy", "Terms" (opens Safari to greenflagged.xyz/{privacy,terms}).
4. **Sign out** — destructive `GFButton("Sign out →", style: .ghost)` with red tint.

---

## 10. Billing / Paywall

**Files:** `Features/Billing/BillingView.swift`, `PaywallSheet.swift`
**Web parity:** `landing/app/(app)/settings/billing/page.tsx`
**Spec:** see [`billing-iap.md`](billing-iap.md) for the StoreKit details.

### BillingView (full page, accessed from Settings)
- Current plan card: plan name + status + period end
- Usage meter (same widget as Dashboard)
- Products list:
  - **Standard $28.99/mo** — `GFButton("Subscribe →", style: .solid)`
  - **+1 credit $3.99** — quantity stepper + `GFButton("Buy →", style: .solid)`
- "Restore purchases" link at bottom (StoreKit `AppStore.sync()`)

### PaywallSheet (modal, triggered on 402)
Smaller version of BillingView. Forces user choice:
- Heading: `// QUOTA REACHED`
- Subtitle: "You've used your free scans this month."
- Two options stacked:
  - Buy 1 credit ($3.99)
  - Subscribe to Standard ($28.99/mo, includes 10 scans)
- "Dismiss" link at bottom (returns to Scan view)

---

## Empty / error states (global)

- **Network down**: toast at top "No connection · Showing cached data"
- **401**: silently refresh; if refresh fails → bounce to SignIn
- **402**: `PaywallSheet`
- **5xx**: toast "Something went wrong · Tap to retry"
