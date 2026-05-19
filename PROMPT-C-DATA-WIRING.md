# PROMPT C — iOS data wiring + onboarding + Settings overhaul

**Working directory:** `/Users/romanpochtman/Developer/ContractChecker/ios/Green Flagged/`
**Suggested agent:** `swift-ui-architect`
**Depends on:** Prompt A (must finish — `Session` needs to exist with real auth state and `supabase` client). Prompt B preferred but not strict (B owns `ThemePreference.swift` which this prompt binds to in `SettingsView`).
**Blocks:** nothing

---

## Read first

- `AGENTS.md`
- `claude/api/contracts.md`
- `landing/app/(app)/onboarding/actions.ts` (canonical onboarding contract)
- `landing/app/(app)/dashboard/page.tsx` (canonical dashboard data shape)
- `landing/app/(app)/settings/page.tsx` (canonical settings server action)
- `landing/lib/supabase/types.ts` (Database type — column names)
- MemPalace: run `mempalace search "greenflagged Phase 1 foundation" --wing greenflagged` to load shared contracts (table shapes, RLS notes)
- The Session class shipped by Prompt A: `Core/Session.swift`

## Goal

Delete every mock from Dashboard / Contracts / Settings and replace with real Supabase reads. Build the 3-step OnboardingFlow that mirrors web. Wire the appearance picker bound to `@AppStorage("gf-theme")` (added by Prompt B). ScanView and Verdict are out of scope.

## Tasks

1. **Create `Core/Repositories/ProfileRepository.swift`:**
   - `actor ProfileRepository { static let shared = ProfileRepository() }`
   - `func fetchCurrent() async throws -> Profile?` — `supabase.from("profiles").select().eq("user_id", currentUserId).maybeSingle()`. RLS enforces auth.uid() filter; passing user_id is redundant but explicit is fine.
   - `func upsert(accountType: AccountType, country: String, businessName: String?, markOnboarded: Bool) async throws -> Profile` — match exact column names from `landing/lib/supabase/types.ts` (`account_type`, `country_code`, `business_name`, `onboarded_at`). When `markOnboarded` is true, set `onboarded_at` to `ISO8601` of now.

2. **Create `Core/Repositories/ContractRepository.swift`:**
   - `func list(kind: ContractKind?, page: Int, pageSize: Int = 20) async throws -> [Contract]` — orders by `created_at` descending, applies `range(page * pageSize, (page + 1) * pageSize - 1)`. Filters by `kind` when non-nil.
   - Ensure `Contract` Codable struct matches the table: `id`, `owner_id`, `kind`, `industry`, `title`, `storage_path`, `verdict_severity`, `created_at`, `retention_until`.

3. **Create `Core/Repositories/UsageRepository.swift`:**
   - `func monthlyCounts() async throws -> (scans: Int, drafts: Int)` — two `count(.exact, head: true)` queries against `usage_events` with `kind` filter and `created_at >= startOfCurrentMonth`.
   - `func recent(limit: Int = 5) async throws -> [UsageEvent]` — ordered desc.

4. **Build `Features/Onboarding/OnboardingFlow.swift`** — replace Prompt A's stub:
   - `NavigationStack` with `path: [OnboardingStep]`.
   - `OnboardingStep` enum: `.country`, `.businessName`.
   - Step 1 (root): `AccountTypeStep` — two `GFFrame` radio cards (`SOLO` / `BUSINESS`). Tap pushes `.country`.
   - Step 2: `CountryStep` — `Picker` over a curated country list (start with: US, CA, GB, DE, FR, NL, ES, IT, PL, AU, RU, UA — extend as needed). Pre-select via `Locale.current.region?.identifier ?? "US"`. Continue button: if `accountType == .business`, push `.businessName`; else commit immediately.
   - Step 3: `BusinessNameStep` — `GFInput` for name, required, `GFButton("FINISH →")` commits.
   - Commit: `try await ProfileRepository.shared.upsert(accountType: ..., country: ..., businessName: ..., markOnboarded: true)`, then `await session.refreshProfile()` which flips state to `.signedIn`.
   - Error path: show inline `GFTag` with red severity, keep user on the same step.

5. **Create `Features/Dashboard/DashboardViewModel.swift`:**
   ```swift
   @MainActor @Observable final class DashboardViewModel {
       enum State { case loading, loaded(DashboardData), error(String) }
       var state: State = .loading
       func load() async {
           do {
               async let profile = ProfileRepository.shared.fetchCurrent()
               async let contracts = ContractRepository.shared.list(kind: nil, page: 0, pageSize: 10)
               async let counts = UsageRepository.shared.monthlyCounts()
               async let usage = UsageRepository.shared.recent(limit: 5)
               let data = try await DashboardData(
                   profile: profile, contracts: contracts,
                   scansThisMonth: counts.scans, draftsThisMonth: counts.drafts,
                   recentUsage: usage
               )
               state = .loaded(data)
           } catch { state = .error(error.localizedDescription) }
       }
   }
   ```
   - Redefine `DashboardData` (currently at `Features/Dashboard/DashboardView.swift:216`) as a plain struct in `Features/Dashboard/DashboardData.swift`. **Delete `DashboardData.preview` entirely.**

6. **Edit `Features/Dashboard/DashboardView.swift`:**
   - Remove all hardcoded sample contracts and remove `DashboardData.preview`.
   - Inject `@State private var vm = DashboardViewModel()`; in body, switch on `vm.state`. `.loading` → centered `GFTag("LOADING…")`. `.error(msg)` → `GFTag(msg, severity: .red)` + retry button. `.loaded(data)` → existing layout with data wired in.
   - `.task { await vm.load() }`.
   - `.refreshable { await vm.load() }` for pull-to-refresh.
   - Empty state (loaded but zero contracts): `GFCard` saying "NO CONTRACTS YET · SCAN YOUR FIRST" with a `GFButton("SCAN →")` that programmatically switches the tab to Scan. Tab selection state may need to lift to a shared `@Bindable` or `@AppStorage`.

7. **Edit `Features/Contracts/ContractsListView.swift`:**
   - Replace the empty `[Contract]` array in `ContractsListViewModel` with real fetches.
   - `refresh()` resets `page = 0` and reloads via `ContractRepository.shared.list(kind: currentKind, page: 0)`.
   - `loadMore()` increments `page` and appends results until a page returns fewer than `pageSize` items.
   - Filter chip taps drive `currentKind` and trigger `refresh()`.

8. **Edit `Features/Settings/SettingsView.swift`** — full overhaul:
   - **Account section:** replace hardcoded `"you@greenflagged.xyz"` with `session.user?.email ?? "—"`. Bind `account_type`, `country`, `business_name` as editable rows. Save via `ProfileRepository.shared.upsert(..., markOnboarded: false)` (preserves `onboarded_at`).
   - **Plan section:** replace hardcoded `"FREE"` badge with derived plan. For today: just show `"FREE"` because `subscriptions` table is not yet present in schema 0001. Add a `// TODO: derive from subscriptions table once billing schema ships (next session)` comment.
   - **Appearance section (NEW):** add a section titled `APPEARANCE` between `Account` and `Sign out`. Contains:
     ```swift
     @AppStorage("gf-theme") private var themeRaw: String = ThemePreference.system.rawValue
     // ...
     Picker("Appearance", selection: $themeRaw) {
         ForEach(ThemePreference.allCases, id: \.rawValue) { pref in
             Text(pref.label).tag(pref.rawValue)
         }
     }
     .pickerStyle(.segmented)
     ```
     Styled with `Font.gf.label` headers and 2px corners. The `ThemePreference` type is provided by Prompt B (`Core/ThemePreference.swift`).
   - **Sign out:** wire button to `session.signOut()`. Wrap in a confirmation `.alert("Sign out?", ...)`. On confirm: `Task { await session.signOut() }`.

9. **Build and run** in simulator. Manually exercise:
   - Sign in (Apple or Google — requires real account; use TestFlight build or sim with iCloud signed in).
   - Onboarding 3 steps → row appears in `profiles` with `onboarded_at` set.
   - Dashboard shows real (empty) state, empty CTA works.
   - Contracts tab shows empty list.
   - Settings: email is your real Apple/Google email. Edit account_type → row updates in DB. Toggle Appearance segmented control → app switches mode instantly.
   - Sign out → confirm → returns to SignInView. Sign back in → no re-onboarding (because `onboarded_at` is set).

## Constraints

- All Supabase reads via supabase-swift's PostgREST client (`supabase.from("contracts").select()...`). RLS enforces the `auth.uid()` boundary.
- No `/api/scan`, `/api/contracts/draft`, `/api/contracts/improve` calls today. `ScanView` keeps its existing local state machine — do not touch it.
- Match web's column names exactly. Web `landing/lib/supabase/types.ts` is canon.
- **Do not touch `Color+GF.swift`, `ThemePreference.swift`, or `Green_FlaggedApp.swift`** — Prompt B owns those.
- **Do not touch `Core/Session.swift`, `Core/Supabase.swift`, `App/RootView.swift`, `Features/Auth/SignInView.swift`** — Prompt A owns those.
- Git: stay on `main`.

## Verification

1. Build clean for iPhone 16 / iOS 26.
2. `grep -rn "DashboardData.preview\|you@greenflagged.xyz" "Green Flagged/"` returns empty.
3. `grep -rn "// TODO Phase 3" "Green Flagged/Features/Contracts/"` returns empty (the contracts stubs are real now).
4. End-to-end happy path works as described in task 9.
5. Force-quit and relaunch: appearance preference persists; signed-in user returns to Dashboard without re-onboarding.

## Out of scope for this prompt

- Theme tokens / `Color+GF.swift` refactor — Prompt B
- Auth foundation — Prompt A
- StoreKit / IAP, AI scan submission, draft generation — future session
