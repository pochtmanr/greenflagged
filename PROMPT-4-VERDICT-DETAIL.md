# PROMPT 4 — Contract detail / verdict screen + list refresh + tap wiring

**Working directory:** `/Users/romanpochtman/Developer/ContractChecker/`
**Suggested agent:** `swift-ui-architect`
**Depends on:** P3 (which created `APIClient` and the `ContractDetailView` placeholder)
**Blocks:** P5 (the draft wizard ends by presenting this screen)
**Estimated size:** ~3 hours

---

## Read first

```
mempalace search "greenflagged design dropdown card severity" --wing greenflagged --room design
mempalace search "greenflagged ios contracts verdict" --wing greenflagged
```

Then read:
1. `AGENTS.md`, `CLAUDE.md` — repo rules.
2. `ios/Green Flagged/Green Flagged/Features/Contracts/ContractsListView.swift` — the list. Note the no-op tap at lines 103–105 (you're replacing it).
3. `ios/Green Flagged/Green Flagged/Features/Dashboard/DashboardView.swift` — the `populatedContracts` section (lines 147–180). Row taps here also need to navigate.
4. `ios/Green Flagged/Green Flagged/Core/Repositories/ContractRepository.swift` — existing read patterns. Add the new methods here, don't invent a new repo.
5. `ios/Green Flagged/Green Flagged/Models/Contract.swift`, `Severity.swift` — existing models.
6. `landing/app/(app)/contracts/[id]/page.tsx` — the web verdict page. The Swift screen should feel like this but composed of the existing `GFFrame` / `GFCard` / `GFTag` primitives.
7. `landing/components/contracts/verdict-view.tsx` — the web component for verdict markdown + taxonomy + redlines layout. Use as a visual reference.
8. `landing/lib/ai/review.ts` — exact shape of `verdict_md`, `taxonomy`, `redlines`. The `scans` table stores `taxonomy` as JSON, `redlines` as JSON, `verdict_md` as text, `source_text` as text.
9. `landing/app/api/contracts/[id]/route.ts` — DELETE endpoint (uses `getSupabaseServer`, must be retrofitted to Bearer).
10. `landing/app/api/contracts/[id]/pdf/route.ts` and `landing/app/api/contracts/[id]/report/pdf/route.ts` — PDF endpoints (same Bearer retrofit needed).

## Goal

Tapping a contract — from the Home list or the Contracts tab — must open a real **`ContractDetailView`** that mirrors the web verdict page: severity stripe, title, taxonomy tags, an ordered list of redlines, the markdown verdict body, source text toggle, plus actions (download PDF, delete). Wire taps from both screens. Also force the Contracts tab list to refresh on `.onAppear` so the "empty" complaint goes away.

## Tasks

### Task 1 — Web-side Bearer retrofit (3 routes)

Swap `getSupabaseServer()` for `getSupabaseFromRequest()` in:
- `landing/app/api/contracts/[id]/route.ts`
- `landing/app/api/contracts/[id]/pdf/route.ts`
- `landing/app/api/contracts/[id]/report/pdf/route.ts`

For each file change both the import and the callsite. Run `pnpm tsc --noEmit` in `landing/` — must be clean.

### Task 2 — New models

Create `ios/Green Flagged/Green Flagged/Models/ScanResult.swift`:

```swift
import Foundation

struct ScanResult: Decodable, Sendable {
    let contractId: String
    let verdictMd: String
    let taxonomy: [String: TaxonomyEntry]
    let redlines: [Redline]
    let sourceText: String

    enum CodingKeys: String, CodingKey {
        case contractId = "contract_id"
        case verdictMd = "verdict_md"
        case taxonomy, redlines
        case sourceText = "source_text"
    }
}

struct TaxonomyEntry: Decodable, Sendable {
    let summary: String?
    let severity: Severity?     // green | yellow | orange | red, optional
    // Keep this lenient — the JSON includes a free-form set of keys.
    // Web's TS type is { summary?: string; severity?: ... } so anything else
    // is ignored.
}

struct Redline: Decodable, Sendable, Identifiable {
    let id = UUID()
    let title: String
    let severity: Severity
    let body: String
    let quote: String?

    enum CodingKeys: String, CodingKey {
        case title, severity, body, quote
    }
}
```

Look at `landing/lib/ai/review.ts` for the canonical shape — your decoders must tolerate missing optional fields. The taxonomy keys are dynamic (per-contract), so use `[String: TaxonomyEntry]` not a struct.

### Task 3 — Extend `ContractRepository`

Add to `Core/Repositories/ContractRepository.swift`:

```swift
extension ContractRepository {
    /// Reads a single contract row by id. Returns nil on not-found.
    func get(id: String) async throws -> Contract?

    /// Reads the latest scan record for this contract from the `scans` table.
    /// Returns nil if the contract is a `drafted` kind with no scan.
    func scanResult(contractId: String) async throws -> ScanResult?
}
```

Both go through the existing supabase client; `.eq("contract_id", id).maybeSingle()` for the scans read. The `scans` table columns to select: `contract_id, verdict_md, taxonomy, redlines, source_text`. Return `nil` if the row is missing rather than throwing.

### Task 4 — Extend `APIClient` with detail/PDF/delete methods

Add to `Core/APIClient.swift`:

```swift
extension APIClient {
    /// DELETE /api/contracts/{id}. Returns void on 204.
    func deleteContract(id: String, token: String) async throws

    /// GET /api/contracts/{id}/pdf — returns raw PDF bytes.
    /// The web has two PDF endpoints: /pdf returns the rendered contract
    /// (draft), /report/pdf returns the verdict report. For a scanned
    /// contract the report is what we want; for a draft, the contract
    /// itself. Branch in the caller; APIClient just exposes both.
    func contractPDF(id: String, token: String) async throws -> Data
    func contractReportPDF(id: String, token: String) async throws -> Data
}
```

Same Bearer + error mapping pattern from P3. 404 → `.server(status: 404, message:)`, 204 → success (no decode).

### Task 5 — Build `ContractDetailView`

Replace the placeholder file from P3 at `ios/Green Flagged/Green Flagged/Features/Contracts/ContractDetailView.swift`. The screen is a `NavigationStack`-pushed view (not modal-from-nothing — we'll present it from list rows via `NavigationLink` and from the dashboard row via a sheet).

Layout (top to bottom inside a `ScrollView`):

1. **Severity stripe + title header** — full-width band whose color is `Color.gf.sev<Severity>Tint` for light / a darker shade for dark mode (use the existing `Severity` color mappings). Inside the band: a `GFTag` with the severity label (e.g. `CRITICAL`) and the verdict short label, then below it the contract title in `.gf.h2`, kind badge (`SCANNED` / `DRAFTED`), and relative date.

2. **Taxonomy section** — `GFCard` titled `// CONTRACT MAP`. Render each taxonomy key as a `GFSpecRow(key: <KEY UPPER>, value: <entry.summary or "—">)`. If `entry.severity` is set, the right-hand value renders with the severity color.

3. **Redlines section** — `GFCard` titled `// REDLINES`. For each redline:
   - Leading severity `GFTag`.
   - Title in `.gf.h4`.
   - Body in `.gf.bodySm` `Color.gf.fg2`.
   - If `quote` is non-nil: a `GFFrame` block with the quote in mono.
   Order is server-side (red first). If `redlines` is empty, show `// NO ISSUES FLAGGED`.

4. **Verdict markdown section** — `GFCard` titled `// FULL REVIEW`. Render `verdictMd` as markdown. SwiftUI 5+ has `Text(.init(verdictMd))` which handles **bold**, *italic*, `inline code`, and links inline. For headers / lists, split on newlines and render each line through `Text(.init(...))` — it's lo-fi but readable. Don't pull in a markdown library.

5. **Source text toggle** — `GFButton(label: showSource ? "HIDE SOURCE" : "VIEW SOURCE", style: .link)`. When expanded, render `sourceText` in a `GFFrame` with `.font(.gf.mono)`, monospaced, in a scroll view with `frame(maxHeight: 480)` so it doesn't take over.

6. **Footer actions** — a row of `GFButton`s:
   - `EXPORT PDF` (solid) — calls `APIClient.shared.contractReportPDF(id:token:)` if kind is `.scanned`, or `contractPDF(id:token:)` if `.drafted`. Save the resulting `Data` to a temp URL, present via `UIActivityViewController` (using `UIViewControllerRepresentable`).
   - `DELETE` (ghost, red) — confirmation alert, then `APIClient.shared.deleteContract(id:token:)`, pop the view, broadcast a refresh signal (see Task 7).

Top-bar: standard `NavigationStack` chrome with the contract id (first 8 chars) as the title. Provide a `Cancel` / `Done` back button when presented modally from the scan flow.

If the contract is `kind = .drafted`, the redlines + taxonomy sections won't exist (drafts don't have a scan row). Branch the layout: drafts show "// DRAFT CONTRACT", a `GFCard` with the rendered body markdown (from `contract_versions.body_md` — add a `ContractRepository.latestVersionBody(contractId:)` helper if it'd help), and a single `EXPORT PDF` action. Keep scanned-vs-drafted branching at the top of `ContractDetailView.body`.

### Task 6 — Wire the tap from both list locations

In `ContractsListView.swift`:
- Wrap the list inside a `NavigationStack` (already there at line 8 — verify the surrounding `NavigationStack { ... }` block).
- Replace the `Button { /* no-op */ }` at lines 102–108 with a `NavigationLink(value: contract.id) { ContractRow(contract: contract) }`.
- Add a `.navigationDestination(for: String.self) { id in ContractDetailView(contractId: id) }` on the outer `ScrollView` (or the inner `VStack`).
- Add `.onAppear { Task { await vm.refresh() } }` on the outer `ZStack` so the list refetches every time the tab is shown — this fixes the "empty" complaint when contracts exist but the tab hasn't refreshed since boot.

In `DashboardView.swift`:
- The dashboard isn't inside a `NavigationStack`. Wrap `loadedState(_ data:)`'s `ScrollView` in a `NavigationStack` so list rows can push detail.
- Update `ContractRowView` to be a `NavigationLink` (the row already has the chevron — make it actually navigate).
- Same `.navigationDestination(for: String.self) { id in ContractDetailView(contractId: id) }`.

### Task 7 — List refresh after delete

When `ContractDetailView` deletes a contract and pops, both lists should drop the row. Use a lightweight notification:

- In `ContractRepository`, expose a `notificationCenter`-style refresh signal: `static let contractsChanged = Notification.Name("gf.contracts.changed")`.
- `ContractDetailView`'s delete handler posts the notification after a successful 204.
- Both view models (`DashboardViewModel`, `ContractsListViewModel`) observe it via `.onReceive(NotificationCenter.default.publisher(for: ContractRepository.contractsChanged))` in the view layer, calling `await vm.refresh()`.

### Task 8 — "+ NEW" button on the Contracts tab

Add a top-right `+` toolbar item on `ContractsListView`'s `NavigationStack` that opens the draft wizard (Prompt 5's `DraftWizard`). If `DraftWizard` doesn't exist yet, stub it:

```swift
struct DraftWizard: View {
    var body: some View {
        Text("Draft wizard ships in Prompt 5.")
            .font(.gf.bodySm)
            .foregroundStyle(Color.gf.fg2)
    }
}
```

Present via `.sheet(isPresented: $showDraftWizard) { DraftWizard() }` — Prompt 5 will replace the body and may switch to `.fullScreenCover`.

## Constraints

- Stay on `main`.
- No external markdown / PDF libraries. SwiftUI built-ins handle our needs.
- No new design tokens. Reuse `GFCard`, `GFFrame`, `GFTag`, `GFSpecRow`, `GFButton`.
- Never log the Bearer token or the full source text body.
- The PDF share sheet must work on iPhone (no `.popoverPresentationController` weirdness).

## Web data contract (read directly from Supabase, RLS-protected)

Tables:
- `contracts` — already mapped by `Contract` model. `kind` is `scanned` | `drafted`; `verdict_severity` is the column on this row.
- `scans` — one row per scanned contract. `(contract_id, verdict_md, taxonomy, redlines, source_text, created_at)`.
- `contract_versions` — one row per draft version. `(contract_id, version, body_md, pdf_path)` — for drafts you read the highest `version`.

RLS lets the iOS app read these directly with the Supabase JWT. No new API endpoint needed for the read path — only for DELETE and PDF download.

## Done when

- [ ] All three `[id]/*` web routes use `getSupabaseFromRequest()`.
- [ ] `ScanResult`, `TaxonomyEntry`, `Redline` models exist and decode.
- [ ] `ContractRepository.get(id:)`, `scanResult(contractId:)`, (optional) `latestVersionBody(contractId:)` work.
- [ ] `APIClient.deleteContract`, `contractPDF`, `contractReportPDF` work end-to-end on a real contract.
- [ ] `ContractDetailView` renders verdict UI for a scanned contract and draft UI for a drafted one.
- [ ] Tap on a contract row from BOTH the Home tab and the Contracts tab pushes the detail view.
- [ ] `.onAppear { vm.refresh() }` is on `ContractsListView` — list refreshes every visit.
- [ ] DELETE triggers list refresh on both screens via the `contractsChanged` notification.
- [ ] `+ NEW` toolbar button exists on Contracts tab and opens a sheet (stub OK).
- [ ] Build passes; manual smoke on device works.

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

Then Roman on his iPhone:
1. Scan a contract (P3 must be done) → land on real verdict screen, not placeholder.
2. Open Contracts tab → see the new contract → tap → land on same verdict screen.
3. Tap EXPORT PDF → share sheet appears with the report PDF.
4. Tap DELETE → confirm → returns to list, contract gone from both tabs.
5. Pull-to-refresh on Contracts tab still works.

## Out of scope

- Editing a draft after the fact (web has `/api/contracts/[id]/fix`, `/tweak`, `/translate`) — defer.
- The actual draft wizard — Prompt 5.
- Markdown rendering with full GitHub-flavored support — SwiftUI's built-in is the ceiling.
- 402 paywall on PDF export — Prompt 7.
