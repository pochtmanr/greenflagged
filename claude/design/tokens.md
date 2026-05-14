# Design tokens — web → iOS mapping

Brand identity must match the web exactly. Same palette, same type scale, same
sharp 2px corners, same UPPERCASE mono labels. iOS gets a `Design/` Swift
module that mirrors `landing/app/globals.css` `.gf-*` classes.

## Colors

### Sage green — primary palette
| Token | Hex | iOS |
|---|---|---|
| `green-50` | `#EFF4F1` | `Color.gf.green50` |
| `green-100` | `#DDE8E1` | `Color.gf.green100` |
| `green-200` | `#BCD0C2` | `Color.gf.green200` |
| `green-300` | `#94B5A1` | `Color.gf.green300` (text/accent) |
| `green-400` | `#6E9882` | `Color.gf.green400` |
| `green-500` | `#4A7A5C` | `Color.gf.green500` (PRIMARY) |
| `green-600` | `#3F6A4F` | `Color.gf.green600` |
| `green-700` | `#335640` | `Color.gf.green700` |
| `green-800` | `#264130` | `Color.gf.green800` |
| `green-900` | `#1A2D21` | `Color.gf.green900` |
| `green-950` | `#0F1C14` | `Color.gf.green950` |

### Semantic roles (dark theme — iOS default)
| Role | Web | iOS |
|---|---|---|
| `--bg` | `#121212` | `Color.gf.bg` |
| `--surface` | `#1A1A1A` | `Color.gf.surface` |
| `--surface-elev` | `#222222` | `Color.gf.surfaceElev` |
| `--fg-1` | `#F2F0EC` | `Color.gf.fg1` |
| `--fg-2` | `#B8B5AE` | `Color.gf.fg2` |
| `--fg-3` | `#7E7B74` | `Color.gf.fg3` |
| `--fg-4` | `#52504B` | `Color.gf.fg4` |
| `--accent` | green-300 | `Color.gf.accent` |
| `--accent-strong` | green-500 | `Color.gf.accentStrong` |
| `--rule` | `#2A2A2A` | `Color.gf.rule` |
| `--rule-strong` | `#3A3A3A` | `Color.gf.ruleStrong` |
| `--rule-soft` | `#1F1F1F` | `Color.gf.ruleSoft` |

### Severity scale (used for verdict + tags)
| Token | Hex | iOS |
|---|---|---|
| `--sev-green` | `#4A7A5C` | `Color.gf.sevGreen` |
| `--sev-yellow` | `#FFD600` | `Color.gf.sevYellow` |
| `--sev-orange` | `#FF8A1F` | `Color.gf.sevOrange` |
| `--sev-red` | `#FF3D5C` | `Color.gf.sevRed` |

**Rule:** Green is the only decorative color. Yellow/orange/red exist only as
severity signals. Never use them as accents.

## Typography

Inter for body, JetBrains Mono for labels/keys/spec rows.

| Web class | Spec | iOS |
|---|---|---|
| `.gf-display` | Inter, 64–96pt, -0.04em, UPPER | `Font.gf.display` |
| `.gf-h1` | Inter, 48pt, -0.03em, UPPER | `Font.gf.h1` |
| `.gf-h2` | Inter, 32pt, -0.025em, UPPER | `Font.gf.h2` |
| `.gf-h3` | Inter, 22pt, -0.02em, UPPER | `Font.gf.h3` |
| `.gf-h4` | Inter, 18pt, -0.015em | `Font.gf.h4` |
| `.gf-body` | Inter, 16pt, 1.5 leading | `Font.gf.body` |
| `.gf-body-sm` | Inter, 14pt | `Font.gf.bodySm` |
| `.gf-label` | JetBrains Mono, 11pt, +0.08em, UPPER | `Font.gf.label` |
| `.gf-mono` | JetBrains Mono, 14pt | `Font.gf.mono` |
| `.gf-mono-sm` | JetBrains Mono, 12pt | `Font.gf.monoSm` |
| `.gf-kbd` | JetBrains Mono in a box | `KeyboardKey` view |

Both fonts ship with the app bundle (Inter, JetBrains Mono OTFs in
`ios/GreenFlagged/Resources/Fonts/`). Register via `Info.plist`
`UIAppFonts`.

## Spacing

| Web | Value | iOS |
|---|---|---|
| `--space-1` | 4 | `Spacing.s1` |
| `--space-2` | 8 | `Spacing.s2` |
| `--space-3` | 12 | `Spacing.s3` |
| `--space-4` | 16 | `Spacing.s4` |
| `--space-5` | 24 | `Spacing.s5` |
| `--space-6` | 32 | `Spacing.s6` |
| `--space-7` | 48 | `Spacing.s7` |
| `--space-8` | 64 | `Spacing.s8` |
| `--space-9` | 96 | `Spacing.s9` |

## Radius

| Web | Value | iOS |
|---|---|---|
| `--radius-0` | 0 | `0` |
| `--radius-1` | 2 | `2` (default for cards, buttons, tags) |
| `--radius-full` | 9999 | `.infinity` |

**Rule:** Everything is 2px radius. No rounded blobs.

## Components

### Frame (corner-marked card)
Web `.gf-frame` has 4 corner brackets (`gf-frame-bl`, `gf-frame-br` spans).
iOS:
```swift
struct GFFrame<Content: View>: View {
    @ViewBuilder var content: Content
    var body: some View {
        content
            .padding(Spacing.s4)
            .background(Color.gf.surface)
            .overlay(FrameCorners())   // 4 L-shaped brackets, 12pt arms
            .clipShape(RoundedRectangle(cornerRadius: 2))
    }
}
```

### Card (plain hairline)
Web `.gf-card` — 1px hairline border, no corner markers.
```swift
GFCard { ... }  // = surface bg + 1px rule border, no brackets
```

### Tag
Web `.gf-tag` — bracketed mono label `[SEVERITY-RED]`. Variants `sev-{red|orange|yellow|green}`.
```swift
GFTag("DO NOT SIGN", severity: .red)
// Renders: "[DO NOT SIGN]" in JetBrains Mono with red text + 1px red border
```

### Button
Web `.gf-btn` ink fill, `.gf-btn-ghost` outline, `.gf-btn-link` underlined mono.
```swift
GFButton("Scan contract", style: .solid)
GFButton("Cancel", style: .ghost)
GFButton("Download report", style: .link)
```
All button styles render a `→` arrow span on the right; arrow translates +4pt
on pressed state (web equivalent of `.arrow` hover animation).

### Spec row
Web `.gf-specrow` — `KEY ······· VALUE` with dotted leader.
```swift
GFSpecRow(key: "STATUS", value: "READY · 248 KB")
```

## Severity labels (canonical)

| Severity | Long label | Short label |
|---|---|---|
| `green` | `GREEN FLAGGED` | `OK` |
| `yellow` | `MINOR ISSUES` | `WARN` |
| `orange` | `RED FLAGS` | `HIGH` |
| `red` | `DO NOT SIGN` | `CRITICAL` |

Long label only on the verdict stripe. Short label inside taxonomy/redline tags.

## Taxonomy labels

| Key | Label |
|---|---|
| `ip_ownership` | IP ownership |
| `payment_terms` | Payment terms |
| `termination` | Termination |
| `nda_scope` | NDA scope |
| `liability_cap` | Liability cap |
| `jurisdiction` | Jurisdiction |
| `auto_renewal` | Auto-renewal |
| `kill_fees` | Kill fees |
| `exclusivity` | Exclusivity |

Mirror these in `Models/Taxonomy.swift` as an enum with a `label` computed property.

## What iOS does NOT copy from web

- No GSAP-driven masked word reveal — too web-specific. iOS uses
  `.transition(.opacity.combined(with: .move(edge: .bottom)))`.
- No canvas dot-matrix particle field. iOS hero (if any) uses a static
  vector pattern or a simple parallax of the GREEN ◇ FLAGGED wordmark.
- No `backdrop-blur` glass cards. Brand is sharp/flat.
- No Liquid Glass material. (Despite iOS 26 supporting it, Green Flagged's
  design language is the opposite.)
