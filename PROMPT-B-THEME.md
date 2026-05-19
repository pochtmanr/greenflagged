# PROMPT B — iOS light theme + design tokens resync

**Working directory:** `/Users/romanpochtman/Developer/ContractChecker/ios/Green Flagged/`
**Suggested agent:** `swift-ui-architect`
**Depends on:** nothing — can run from t=0
**Blocks:** nothing (Prompt C will not edit `Color+GF.swift`, `ThemePreference.swift`, or `Green_FlaggedApp.swift`)

---

## Read first

- `AGENTS.md` (project rules)
- `claude/design/tokens.md` — **but this doc is stale**; do not treat it as canonical
- `landing/app/globals.css` lines 1–160 — **this is the canonical source of truth for tokens in both light and dark mode**
- `Design/Color+GF.swift`, `Design/Font+GF.swift`, `Design/Severity.swift`

## Critical context

The web's design system **flipped to light-by-default** since `claude/design/tokens.md` was last updated. The current `Design/Color+GF.swift` is stale: dark-only, and its dark hex values do not match the web's current dark palette.

- Dark `--bg` is `#0E110F` (web), not `#121212` (iOS current).
- Dark `--surface` is `#141816` (web), not `#1A1A1A` (iOS current).
- Severity colors have been adjusted: yellow `#C99A0E`, orange `#C8651E`, red `#B7263A` (the previous saturated values are gone).

**Web `globals.css` is canon.** Mirror it exactly.

## Goal

Make the iOS app support light + dark + system, with a user-facing toggle (the toggle UI itself lives in `SettingsView` and Prompt C will add it — you only own the storage primitive `ThemePreference` and the binding from `@main`). Mirror web's exact palette in both appearances.

## Tasks

1. **Refactor `Design/Color+GF.swift`:**
   - Keep the green-50..950 palette unchanged (they're the same in both themes).
   - Add primitives:
     - Paper: `paper0 #FFFFFF`, `paper50 #FBFAF6`, `paper100 #F5F3EC`, `paper200 #ECE9DF`, `paper300 #D9D5C7`, `paper400 #B8B3A1`.
     - Ink: `ink100 #6B6B5E`, `ink200 #4E4F45`, `ink300 #2C2F28`, `ink400 #141713`, `ink500 #0B0E0B`.
   - Replace all semantic statics (`bg`, `surface`, `surfaceElev`, `fg1`, `fg2`, `fg3`, `fg4`, `rule`, `ruleStrong`, `ruleSoft`, `accent`, `accentStrong`) with dynamic colors that resolve per appearance:
     ```swift
     static let bg = Color(UIColor { traits in
         traits.userInterfaceStyle == .dark
             ? UIColor(red: 0x0E/255, green: 0x11/255, blue: 0x0F/255, alpha: 1)
             : UIColor(red: 0xFB/255, green: 0xFA/255, blue: 0xF6/255, alpha: 1)
     })
     ```
     Light values from web `:root`, dark values from `:root[data-theme="dark"]`. Use rgba where the web uses rgba (e.g., dark `rule` is `rgba(240,238,230,0.12)`).
   - Update severity to web's current values: `sevYellow #C99A0E`, `sevOrange #C8651E`, `sevRed #B7263A`. `sevGreen` stays `#4A7A5C`. Add tint variants as static let constants (same hex in both modes): `sevGreenTint #E8F0EA`, `sevYellowTint #FBF1D9`, `sevOrangeTint #FBE6D5`, `sevRedTint #F6D8DC`.
   - Helper: introduce `init(uiColor:)` if not present, or write a small `Color.dynamic(light:dark:)` helper that wraps `UIColor(dynamicProvider:)`.
2. **Create `Core/ThemePreference.swift`:**
   ```swift
   import SwiftUI

   enum ThemePreference: String, CaseIterable {
       case system, light, dark
       var colorScheme: ColorScheme? {
           switch self {
           case .system: return nil
           case .light: return .light
           case .dark: return .dark
           }
       }
       var label: String {
           switch self {
           case .system: return "SYSTEM"
           case .light: return "LIGHT"
           case .dark: return "DARK"
           }
       }
   }
   ```
3. **Edit `Green_FlaggedApp.swift`:**
   - Remove `.preferredColorScheme(.dark)`.
   - Add `@AppStorage("gf-theme") private var themeRaw: String = ThemePreference.system.rawValue`.
   - Apply `.preferredColorScheme(ThemePreference(rawValue: themeRaw)?.colorScheme)` to `RootView`.
4. **Sweep all SwiftUI files** under `Green Flagged/` for hardcoded chrome colors that break in light mode. Severity badges stay the same hex (they're signal, not chrome). Anything else that's a raw `Color(hex: 0x…)` for chrome (backgrounds, foregrounds, rules, accents) must move to a semantic token. Common culprits:
   - `App/RootView.swift` uses `Color.gf.bg.ignoresSafeArea()` — fine, that token is now dynamic.
   - `Wordmark`, `MainTabsView`, `DashboardView`, `ContractsListView`, `ScanView`, `SignInView` (whichever exist now) — open each, scan for raw hex.
   - Tab bar (`UITabBar` appearance) — set via `UITabBar.appearance()` and may need a dynamic background.
5. **Build clean** — `xcodebuild -project "Green Flagged.xcodeproj" -scheme "Green Flagged" -destination "platform=iOS Simulator,name=iPhone 16" build`.
6. **Visual verify** in simulator:
   - Run in light mode (`xcrun simctl ui booted appearance light` or simulator menu Features → Toggle Appearance).
   - Run in dark mode.
   - Verify nav, dashboard, contracts list, settings, sign-in screen all read correctly in both modes. Take screenshots (use `xcrun simctl io booted screenshot ~/Desktop/gf-light.png` and `gf-dark.png`) and reference them in your report.

## Constraints

- Web `landing/app/globals.css` is the source of truth, not `claude/design/tokens.md` (stale).
- Sharp 2px corners stay 2px. Green stays the only chrome accent. Severity colors are signal-only.
- **Do not touch `Features/Settings/SettingsView.swift`** — Prompt C owns SettingsView in this wave and will wire the user-facing appearance picker bound to `@AppStorage("gf-theme")`.
- **Do not touch `Core/Session.swift`, `Core/Supabase.swift`, `App/RootView.swift`** — Prompt A owns those.
- Git: stay on `main`.

## Verification

1. `xcodebuild build` clean for iPhone 16 / iOS 26.
2. Simulator in light mode: bg `#FBFAF6`, fg-1 `#0B0E0B` (near-black), accent green-500.
3. Simulator in dark mode: bg `#0E110F`, fg-1 `#F0EEE6` (warm white), accent green-300.
4. Manually setting `UserDefaults.standard.set("light", forKey: "gf-theme")` and relaunching forces light mode regardless of system setting (Prompt C will add the UI for this).
5. `grep -rn "preferredColorScheme(.dark)" "Green Flagged/"` returns empty.
6. `grep -rn "Color(hex: 0x121212)\|Color(hex: 0x1A1A1A)\|Color(hex: 0x222222)" "Green Flagged/"` returns empty (old dark hex values are gone).

## Out of scope for this prompt

- SettingsView UI for the appearance picker — Prompt C
- Auth, data wiring — Prompts A and C
- Anything in `landing/` — Prompt D
