# PROMPT 2 — Wordmark refresh + logo asset + sign-in terms/privacy

**Working directory:** `/Users/romanpochtman/Developer/ContractChecker/`
**Suggested agent:** `swift-ui-architect`
**Depends on:** nothing
**Blocks:** nothing
**Estimated size:** ~45 min

---

## Read first

```
mempalace search "greenflagged design wordmark logo" --wing greenflagged --room design
```

Then read:
- `AGENTS.md` — repo rules.
- `ios/Green Flagged/Green Flagged/Design/Wordmark.swift` — currently renders `GREEN • FLAGGED` with a circle between the two words.
- `ios/Green Flagged/Green Flagged/App/RootView.swift` — splash uses `Wordmark()` at line 12.
- `ios/Green Flagged/Green Flagged/Features/Auth/SignInView.swift` — sign-in uses `Wordmark()` at line 18; footer "BY CONTINUING…" line at line 51.
- `landing/public/logo.svg` — the source asset (482×332 line-art SVG, dashes/lines, no fills).
- `ios/Green Flagged/Green Flagged/Resources/Assets.xcassets/` — destination for the new image set.

## Goal

Three things:

1. **Wordmark visual fix** — the user wants "GREEN FLAGGED" with no decorative dot between the words. Remove the `Circle()`.
2. **Add the brand logo** — bring `landing/public/logo.svg` into the iOS asset catalog as a vector asset, then render it above the wordmark on both the splash (`RootView.loading`) and the sign-in screen.
3. **Explicit Terms / Privacy links on sign-in** — the current footer reads `BY CONTINUING YOU AGREE TO TERMS & PRIVACY.` as a single static label. Make `TERMS` and `PRIVACY` real tappable links opening `https://greenflagged.xyz/terms` and `https://greenflagged.xyz/privacy` respectively. Keep the typography (mono uppercase, `Color.gf.fg3`, tracking 1.2).

## Tasks

1. **Import the logo into the asset catalog.**
   - Copy `landing/public/logo.svg` to `ios/Green Flagged/Green Flagged/Resources/Assets.xcassets/BrandLogo.imageset/logo.svg`.
   - Create `Contents.json` in that imageset with `preserves-vector-representation: true` and a single universal entry pointing at `logo.svg`:
     ```json
     {
       "images" : [
         {
           "filename" : "logo.svg",
           "idiom" : "universal"
         }
       ],
       "info" : {
         "author" : "xcode",
         "version" : 1
       },
       "properties" : {
         "preserves-vector-representation" : true
       }
     }
     ```
   - Verify Xcode picks up the asset on next build (no `.xcassets` project mutation needed — Xcode 16 auto-syncs folder contents).
   - Asset name in Swift: `Image("BrandLogo")`.

2. **Strip the dot from `Wordmark.swift`.**
   - Delete the `Circle().fill(...)` block (lines 10–12).
   - Keep the `HStack(spacing: Spacing.s2)` so "GREEN" and "FLAGGED" still have a small gap between them.

3. **Render the logo above the wordmark.** Create a new view `BrandMark` in the same `Wordmark.swift` file (or split if it stays clean) that vertically stacks logo + wordmark:
   ```swift
   struct BrandMark: View {
       var logoSize: CGFloat = 64
       var body: some View {
           VStack(spacing: Spacing.s4) {
               Image("BrandLogo")
                   .resizable()
                   .renderingMode(.template)
                   .foregroundStyle(Color.gf.accent)
                   .scaledToFit()
                   .frame(width: logoSize, height: logoSize)
               Wordmark()
           }
       }
   }
   ```
   Use `.renderingMode(.template)` + `.foregroundStyle(Color.gf.accent)` so the logo tints to the current accent color in both light and dark mode. The source SVG strokes are already `#4A7A5C` (matches `accent` in light mode) — templating keeps it correct in dark mode too.

4. **Swap `Wordmark()` → `BrandMark()`** in:
   - `App/RootView.swift` line 12 (splash / loading state)
   - `Features/Auth/SignInView.swift` line 18 (sign-in header)
   On the sign-in screen the `BrandMark` should keep the same top padding the wordmark currently has — visually centered above the tagline + buttons.

5. **Make Terms / Privacy real links on sign-in.** Replace lines 51–57 in `SignInView.swift` with a row that has three tappable spans:
   - A leading mono label `BY CONTINUING YOU AGREE TO`
   - `TERMS` link → opens `https://greenflagged.xyz/terms`
   - `&` separator
   - `PRIVACY` link → opens `https://greenflagged.xyz/privacy`

   Implementation pattern — keep it dead simple, no AttributedString tricks:
   ```swift
   HStack(spacing: Spacing.s1) {
       Text("BY CONTINUING YOU AGREE TO")
           .font(.gf.label)
           .tracking(1.2)
           .foregroundStyle(Color.gf.fg3)
       Button("TERMS") {
           if let url = URL(string: "https://greenflagged.xyz/terms") { openURL(url) }
       }
       .buttonStyle(.plain)
       .font(.gf.label)
       .tracking(1.2)
       .foregroundStyle(Color.gf.fg1)
       Text("&")
           .font(.gf.label)
           .foregroundStyle(Color.gf.fg3)
       Button("PRIVACY") {
           if let url = URL(string: "https://greenflagged.xyz/privacy") { openURL(url) }
       }
       .buttonStyle(.plain)
       .font(.gf.label)
       .tracking(1.2)
       .foregroundStyle(Color.gf.fg1)
   }
   .frame(maxWidth: .infinity)
   .padding(.top, Spacing.s2)
   ```
   Add `@Environment(\.openURL) private var openURL` at the top of `SignInView` next to the existing `@Environment(Session.self)` property.

   If the row overflows on small screens, drop to a 2-line layout with the lead text on the first line and the two links + ampersand on the second. Don't introduce a custom layout primitive — a second `HStack` inside a `VStack` is fine.

## Constraints

- Stay on `main`. No PR.
- No new colors. `Color.gf.accent` only for the logo tint.
- No `backdrop-blur`. Repo rule.
- Don't change the wordmark letterforms or tracking.
- Don't open the URLs in an in-app browser — `openURL` defaults to Safari, which is the right behavior for legal links.
- The asset must be SVG with `preserves-vector-representation: true`. Don't add PNG fallbacks at 1x/2x/3x — Xcode 16 handles vector SVG natively.

## Done when

- [ ] `Wordmark` no longer renders a circle.
- [ ] `BrandMark` view exists and renders logo + wordmark.
- [ ] Splash (`RootView.loading`) and sign-in (`SignInView`) both show `BrandMark` instead of bare `Wordmark`.
- [ ] Sign-in footer has two real tappable links to `greenflagged.xyz/terms` and `/privacy`.
- [ ] Asset catalog contains `BrandLogo.imageset/logo.svg` and `Contents.json` with `preserves-vector-representation`.
- [ ] Build passes.

## Verification

```bash
xcodebuild -project "ios/Green Flagged/Green Flagged.xcodeproj" \
           -scheme "Green Flagged" \
           -sdk iphoneos \
           -configuration Debug \
           build \
           CODE_SIGNING_ALLOWED=NO
```

Then Roman runs on his iPhone:
- Cold launch → splash shows logo over `GREEN FLAGGED` (no dot).
- Sign out → sign-in shows the same brand mark; tapping TERMS opens Safari to `greenflagged.xyz/terms`; tapping PRIVACY opens `/privacy`.

