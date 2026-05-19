# PROMPT 1 — Home cards: vertical layout + icons

**Working directory:** `/Users/romanpochtman/Developer/ContractChecker/`
**Suggested agent:** `swift-ui-architect`
**Depends on:** nothing
**Blocks:** nothing (cosmetic; safe to ship anytime)
**Estimated size:** ~30 min

---

## Read first

Run these before touching code:

```
mempalace search "greenflagged design dropdown card" --wing greenflagged --room design
mempalace search "greenflagged ios physical iphone" --wing greenflagged --room ios
```

Then read:
- `AGENTS.md` — repo rules. Stay on `main`, no branches.
- `ios/Green Flagged/Green Flagged/Features/Dashboard/DashboardView.swift` — the file you're editing. The two cards live at lines 89–94 (HStack) and 194–242 (`ScanActionCard`, `DraftActionCard`).
- `ios/Green Flagged/Green Flagged/Design/GFFrame.swift`, `GFCard.swift`, `GFButton.swift` — already-built design primitives. Reuse, don't invent.
- `ios/Green Flagged/Green Flagged/Design/Color+GF.swift` and `Font+GF.swift` — tokens you must use.

## Goal

The Home dashboard's two quick-action cards (`ScanActionCard`, `DraftActionCard`) currently sit in a side-by-side `HStack`. The user wants them **stacked vertically, one after another**, so each card has full width and feels like a clear primary action — and each should carry a leading SF Symbol so the action is recognizable without reading the body copy.

Don't add new colors, fonts, or components. Use the existing `GFFrame`, `GFButton`, design tokens, and SF Symbols only.

## Tasks

1. **Switch layout from HStack to VStack** in `DashboardView.swift` around line 89–94:
   ```swift
   private var quickActions: some View {
       VStack(alignment: .leading, spacing: Spacing.s3) {
           ScanActionCard { selectedTab = .scan }
           DraftActionCard { selectedTab = .scan }
       }
   }
   ```
   Verify each card still calls `.frame(maxWidth: .infinity)` at the bottom of its body (already present) so they fill the full width.

2. **Add an SF Symbol to each card.** The icon goes at the top, before the `// 01 / SCAN` / `// 02 / DRAFT` label, in a row with the label. Use a large-ish weight that reads as a primary illustration rather than a tiny accessory.
   - `ScanActionCard`: `Image(systemName: "doc.viewfinder")`, `.font(.system(size: 28, weight: .regular))`, foreground `Color.gf.accent`.
   - `DraftActionCard`: `Image(systemName: "square.and.pencil")`, `.font(.system(size: 28, weight: .regular))`, foreground `Color.gf.fg2`.

   Layout pattern for the header row inside each card's `VStack`:
   ```swift
   HStack(alignment: .center, spacing: Spacing.s3) {
       Image(systemName: "doc.viewfinder")
           .font(.system(size: 28, weight: .regular))
           .foregroundStyle(Color.gf.accent)
       Text("// 01 / SCAN")
           .font(.gf.label)
           .tracking(1.0)
           .foregroundStyle(Color.gf.accent)
       Spacer()
   }
   ```
   The existing `Text("Scan a contract")` / `Text("Create a contract")` heading and body copy stay below the new header row.

3. **No copy changes.** The card titles ("Scan a contract", "Create a contract"), body copy, and button labels stay exactly as they are.

4. **Verify visual rhythm.** Both cards should now have the same internal structure: icon-row → heading → body → button. Spacing between cards is `Spacing.s3` from the VStack.

## Constraints

- Stay on `main`. No `git checkout -b`, no PR.
- No new colors. `Color.gf.accent` for Scan, `Color.gf.fg2` for Draft is the only treatment.
- No new components. Reuse `GFFrame`, `GFButton`. Don't introduce a `IconHeaderRow` abstraction — three lines of inline HStack is enough.
- No backdrop blur, no rounded corners > 2px. Repo design rule.
- Don't touch `MainTabsView`, `ContractRowView`, or any other dashboard section — just the two card structs.

## Done when

- [ ] `quickActions` uses `VStack` not `HStack`.
- [ ] Each card shows its SF Symbol on the first row, beside the existing mono label.
- [ ] On a physical iPhone, both cards render full-width, stacked, with icons rendering at the correct color.
- [ ] No new files. Only `DashboardView.swift` was touched.

## Verification

```bash
xcodebuild -project "ios/Green Flagged/Green Flagged.xcodeproj" \
           -scheme "Green Flagged" \
           -sdk iphoneos \
           -configuration Debug \
           build \
           CODE_SIGNING_ALLOWED=NO
```

Build must succeed. Then Roman runs the app on his iPhone (no simulator — MemPalace directive `user directive 2026-05-15 — physical iphone only`).

## Out of scope

- Wiring the Draft card to a real wizard — Prompt 5 does that.
- Scanner behavior, contracts list, settings — separate prompts.
- New SF Symbol additions anywhere else.
