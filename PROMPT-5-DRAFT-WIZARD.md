# PROMPT 5 — Draft wizard (create a contract)

**Working directory:** `/Users/romanpochtman/Developer/ContractChecker/`
**Suggested agent:** `swift-ui-architect`
**Depends on:** P3 (APIClient), P4 (ContractDetailView, NavigationStack wiring on the Contracts tab, the `+ NEW` toolbar button stub)
**Blocks:** nothing
**Estimated size:** ~3–4 hours (the longest prompt)

---

## Read first

```
mempalace search "greenflagged design dropdown card" --wing greenflagged --room design
mempalace search "greenflagged ios draft wizard contracts" --wing greenflagged
```

Then read in order:
1. `AGENTS.md`, `CLAUDE.md` — repo rules. Stay on `main`. Never hardcode URLs.
2. `landing/lib/contracts/types.ts` — the `Question` union you'll mirror in Swift.
3. `landing/lib/contracts/industries/freelance.ts`, `software.ts`, `design.ts`, `nda.ts` — the four schemas you'll port. Each defines `questions: Question[]`. **Read all four end-to-end; they're the source of truth.**
4. `landing/app/api/contracts/draft/route.ts` — the endpoint, request schema, response shape.
5. `landing/app/(app)/contracts/new/page.tsx` — the web wizard UI for visual reference (not a direct copy).
6. `ios/Green Flagged/Green Flagged/Features/Contracts/ContractsListView.swift` — the `+ NEW` toolbar button (P4) presents this wizard.
7. `ios/Green Flagged/Green Flagged/Features/Dashboard/DashboardView.swift` — the `DraftActionCard` taps need to route here too (currently routes to `.scan` per line 92).
8. `ios/Green Flagged/Green Flagged/Features/Contracts/ContractDetailView.swift` — your end state: submit → present this view for the new contract id.
9. `ios/Green Flagged/Green Flagged/Design/*.swift` — `GFButton`, `GFCard`, `GFFrame`, `GFInput`, `GFTag`, `GFSpecRow`. Use these. Don't introduce a new component family.

## Goal

A multi-step wizard that lets a signed-in user create a contract from one of four industry templates (Freelance, Software, Design, NDA). Step 1 picks the industry. Step 2 walks question-by-question (or grouped in screens — your call as long as forward/back navigation is clear). Step 3 reviews and submits to `POST /api/contracts/draft`. Success navigates to `ContractDetailView(contractId: response.contract_id)`. The user must be able to back out at any step without losing the answers entered so far.

The web wizard has rich field types (`text`, `select`, `number`, `date`, `toggle`, `checkbox-group`, `name-group`, `address`, `improve-textarea`). You must support all of them. The `improve-textarea` "Improve" button (which polishes user-written prose via the AI) is a stretch goal — gate it behind a TODO comment unless time permits.

## Tasks

### Task 1 — Server-side Bearer retrofit

In `landing/app/api/contracts/draft/route.ts`:
- Swap import and callsite from `getSupabaseServer` → `getSupabaseFromRequest`.
- Also retrofit `landing/app/api/contracts/improve/route.ts` if you wire the Improve button.
- `pnpm tsc --noEmit` clean.

### Task 2 — Swift port of the Question schema

Create `ios/Green Flagged/Green Flagged/Features/Draft/QuestionSchema.swift`:

```swift
import Foundation

enum DraftIndustry: String, CaseIterable, Identifiable, Sendable {
    case freelance, software, design, nda
    var id: String { rawValue }

    var label: String {
        switch self {
        case .freelance: "Freelance services"
        case .software:  "Software engagement"
        case .design:    "Design / creative"
        case .nda:       "NDA / confidentiality"
        }
    }

    var description: String {
        // Pull each industry's description from the matching TS file's
        // exported schema.description.
        ...
    }
}

struct SelectOption: Hashable, Sendable {
    let value: String
    let label: String
}

enum Question: Identifiable, Sendable {
    case text(id: String, label: String, placeholder: String?, multiline: Bool, required: Bool, help: String?)
    case select(id: String, label: String, options: [SelectOption], required: Bool, help: String?, optionDescriptions: [String: String])
    case number(id: String, label: String, min: Double?, max: Double?, step: Double?, suffix: String?, defaultValue: Double?, required: Bool, help: String?)
    case date(id: String, label: String, allowOpenEnded: Bool, openLabel: String?, required: Bool, help: String?)
    case toggle(id: String, label: String, defaultValue: Bool, help: String?)
    case checkboxGroup(id: String, label: String, options: [SelectOption], defaultValue: [String], required: Bool, help: String?)
    case nameGroup(id: String, label: String, showBusiness: Bool, required: Bool, help: String?)
    case address(id: String, label: String, required: Bool, help: String?)
    case improveTextarea(id: String, label: String, fieldKind: String, placeholder: String?, minRows: Int, required: Bool, help: String?)

    var id: String {
        switch self {
        case .text(let id, _, _, _, _, _),
             .select(let id, _, _, _, _, _),
             .number(let id, _, _, _, _, _, _, _, _),
             .date(let id, _, _, _, _, _),
             .toggle(let id, _, _, _),
             .checkboxGroup(let id, _, _, _, _, _),
             .nameGroup(let id, _, _, _, _),
             .address(let id, _, _, _),
             .improveTextarea(let id, _, _, _, _, _, _): return id
        }
    }
}
```

This is **mechanical port work** from TS to Swift. Read `types.ts` carefully — match every variant. Optional fields stay optional.

### Task 3 — Port the four industry question lists

Create one file per industry under `Features/Draft/Industries/`:
- `FreelanceQuestions.swift`
- `SoftwareQuestions.swift`
- `DesignQuestions.swift`
- `NdaQuestions.swift`

Each exports a `static let questions: [Question]` matching the TS file's `<industry>Questions` array. Copy labels, help text, and options verbatim. Use the `clauses`, `formatCurrency`, etc. utilities only on the server — iOS doesn't need them, it only collects answers and submits.

Add an `industrySchema(_:)` function in `QuestionSchema.swift` that maps `DraftIndustry` → `[Question]`.

> **Sync hazard.** These question lists must stay in sync with the TS files. Add a header comment to each file:
> ```swift
> // Mirrors landing/lib/contracts/industries/freelance.ts (freelanceQuestions).
> // If you change one, change the other. Diverging means the iOS form
> // submits answers the server rejects.
> ```

### Task 4 — Answers model

```swift
@Observable
final class DraftAnswers {
    var industry: DraftIndustry? = nil
    var values: [String: AnyAnswer] = [:]
    var title: String? = nil
    var jurisdiction: String? = nil
    var description: String? = nil
    var businessProfileId: String? = nil  // null for now; populate from
                                          // Settings business profile later
}

enum AnyAnswer: Sendable {
    case string(String)
    case number(Double)
    case bool(Bool)
    case stringArray([String])
    case date(Date)
    case nameGroup(first: String?, family: String?, business: String?)
    case address(country: String?, city: String?, street: String?, postal: String?)
}
```

Provide a `func toJSON() -> [String: Any]` on `AnyAnswer` that produces the wire format the server expects (look at `landing/lib/contracts/industries/freelance.ts` `validator` zod schema to confirm shapes).

### Task 5 — Wizard navigation

Create `Features/Draft/DraftWizard.swift`:

```swift
struct DraftWizard: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(Session.self) private var session
    @State private var answers = DraftAnswers()
    @State private var step: WizardStep = .industry
    @State private var submitState: SubmitState = .idle
    @State private var resultContractId: String? = nil

    var body: some View {
        NavigationStack {
            ZStack {
                Color.gf.bg.ignoresSafeArea()
                content
            }
            .toolbar { ... cancel + step indicator ... }
            .navigationDestination(item: $resultContractId) { id in
                ContractDetailView(contractId: id)
            }
        }
    }
}

enum WizardStep: Hashable {
    case industry
    case questions(pageIndex: Int)
    case review
}
```

Step 1 (`.industry`): Vertical list of the four industries as `GFFrame` cards, each tappable. Tap sets `answers.industry` and advances to `.questions(0)`.

Step 2 (`.questions(pageIndex:)`): Render `industrySchema(answers.industry!)` paginated 3–5 questions per page (your call — group by visual cohesion: e.g. client + client_address together, dates together). Provide a `BACK` and `CONTINUE` row at the bottom. `CONTINUE` validates the current page's required fields before advancing. Last page advances to `.review`.

Step 3 (`.review`): Show a `GFCard` summary of all answers as `GFSpecRow`s, plus an optional `Title` text field at the top (defaults from `schema.buildTitle` — for iOS just let user type one, server has a fallback). `SUBMIT` button triggers `Task { await submit() }`.

Render each `Question` variant via a `QuestionField` view that switches on the enum and produces the right control:
- `text` → `GFInput` (or a `TextEditor` in a `GFFrame` for multiline).
- `select` → dropdown matching the Settings dropdown pattern (Prompt 6 builds the `GFDropdown` component — if it doesn't exist yet, fall back to `Picker(.menu)` with the same chrome as the country picker in `SettingsView.swift:155-172`).
- `number` → `TextField` with `.keyboardType(.decimalPad)` and a trailing suffix label.
- `date` → `DatePicker` with `.datePickerStyle(.graphical)` or `.compact` — your call. Wire `allowOpenEnded` as a `Toggle` below the picker; when on, write `<id>_open: true` to `answers.values`.
- `toggle` → `Toggle` with the label.
- `checkbox-group` → vertical list of `GFButton` style toggles, multi-select.
- `name-group` → two-or-three `GFInput`s (first, family, business — last only if `showBusiness`).
- `address` → four `GFInput`s (country, city, street, postal).
- `improve-textarea` → `TextEditor` in a `GFFrame` with a minHeight derived from `minRows * 22pt`. Add a small "IMPROVE" `GFButton(style: .link)` next to the label — gate it behind a `// TODO: call /api/contracts/improve` comment, or actually wire it if time permits (you'd post `{ field_kind, draft, context }` and replace the textarea content with the response `improved`).

Pagination + back/forward must not lose answers on `.onAppear` / `.onDisappear`. Hold state in the `@State var answers` — it survives step switches.

### Task 6 — Submit

```swift
private func submit() async {
    submitState = .submitting
    guard let token = await session.currentAccessToken() else {
        submitState = .error("SESSION EXPIRED")
        return
    }
    do {
        let response = try await APIClient.shared.draftContract(
            industry: answers.industry!.rawValue,
            answers: answers.values.mapValues { $0.toJSON() },
            title: answers.title,
            jurisdiction: answers.jurisdiction,
            token: token
        )
        submitState = .done
        resultContractId = response.contract_id
    } catch APIError.quotaExceeded(let m) {
        submitState = .error("OUT OF DRAFTS · \(m.uppercased())")
    } catch {
        submitState = .error(error.localizedDescription.uppercased())
    }
}
```

Add `draftContract(industry:answers:title:jurisdiction:token:)` to `APIClient`:
- POST to `<baseURL>/api/contracts/draft` with `Authorization: Bearer <token>`, `Content-Type: application/json`.
- Body: `{ industry, answers, title?, jurisdiction? }`. Don't send `body_md` (we're going through the templated answers path).
- Response: `{ contract_id, title }`. Decode and return.
- Error map: 400 → `.server(400, error.message)` plus include `issues[]` if present in the message; 401, 402, 502 same as the scan method.

### Task 7 — Entry points

- **Home tab "START DRAFTING" card** (`DashboardView.swift:236`): change the `onTap` from `selectedTab = .scan` to presenting the wizard via a sheet (`@State private var showDraftWizard: Bool` on `DashboardView`, `.sheet(isPresented: $showDraftWizard) { DraftWizard() }`).
- **Contracts tab `+ NEW`** (added by P4): swap the stub `DraftWizard` body for the real one (or P5 replaces the file entirely).
- **Scan tab "DRAFT" button** — leave alone; scan flow doesn't drift into draft.

## Constraints

- Stay on `main`.
- No third-party form libs. SwiftUI is enough.
- The four question lists must match TS verbatim. If the TS file changes after this prompt ships, a follow-up session syncs.
- Never log answers (they may contain personal info).
- Cancel-with-unsaved-answers needs a confirmation alert — don't silently drop user input.
- Validation: on each `CONTINUE`, check that required fields for the current page are filled. Show inline `GFTag(severity: .red)` next to the offending field. Don't let user advance.
- Server validates again via zod and returns 400 with `issues[]` — surface those if they come back.

## Web API contract (quoted exact)

`POST /api/contracts/draft` — see `landing/app/api/contracts/draft/route.ts`

Request:
```json
{
  "industry": "freelance" | "software" | "design" | "nda",
  "answers": { /* same shape as the matching <industry>Questions schema */ },
  "title": "string?",
  "jurisdiction": "string?",
  "description": "string?",
  "style": { /* ContractStyle | null */ },
  "business_profile_id": "uuid | null"
}
```

Either `answers` or `body_md` is required (we always send `answers`).

Response 200: `{ "contract_id": "<uuid>", "title": "<string>" }`.

Errors:
- 400: `{ "error": "Invalid request body", "detail": "..." }` or `{ "error": "Invalid answers", "issues": [{ "path": "...", "message": "..." }] }`.
- 401: unauthorized.
- 402: quota blocked.
- 500: failed to insert / render PDF / upload PDF — pass-through.

## Done when

- [ ] `/api/contracts/draft` uses `getSupabaseFromRequest()`.
- [ ] `QuestionSchema.swift` + 4 industry question files match the TS schemas (verify against `validator.safeParse(...)` shapes).
- [ ] `DraftWizard` flow runs end-to-end: industry → questions → review → submit → `ContractDetailView`.
- [ ] Cancel mid-wizard prompts confirmation.
- [ ] Required-field validation blocks `CONTINUE`.
- [ ] Home `START DRAFTING` card opens the wizard.
- [ ] Contracts tab `+ NEW` opens the wizard.
- [ ] Submit posts the right JSON, server responds 200, and the iOS app navigates to the new contract's detail.
- [ ] Build passes; manual smoke on device works for at least one industry (Freelance is the most fields — exercise it).

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

Roman on his iPhone:
1. Home → START DRAFTING → wizard opens.
2. Pick Freelance → walk through all questions → review → submit.
3. Land on the new contract's detail with `kind = drafted`.
4. Back to Contracts tab → the draft is listed.
5. Repeat for NDA (the shortest schema).

## Out of scope

- The Improve button calling `/api/contracts/improve` — TODO unless time permits.
- Business profile picker — defer (iOS doesn't yet have a `/api/business-profiles` repo).
- Style / theme picker (web has `coerceStyle(payload.style)`) — server defaults are fine; let users pick later.
- Multi-locale drafts — defer.
- Per-step progress bar — a step counter in the toolbar is fine.
