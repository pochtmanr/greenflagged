# Green Flagged — iOS

Native SwiftUI app for `greenflagged.xyz`. iOS 26+, Xcode 16, Swift 6.

## Status

Not yet scaffolded. Open [`PROMPT.md`](PROMPT.md) in a new Claude Code session
to bootstrap the project from scratch.

## When the project exists

```bash
open ios/GreenFlagged.xcodeproj
```

1. Copy `Secrets.xcconfig.example` → `Secrets.xcconfig`.
2. Fill in `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `API_BASE_URL`.
3. Select the iOS 26 simulator.
4. ⌘R.

## Reading order

1. [`../claude/ios/architecture.md`](../claude/ios/architecture.md) — module layout
2. [`../claude/ios/screens.md`](../claude/ios/screens.md) — screen specs
3. [`../claude/ios/billing-iap.md`](../claude/ios/billing-iap.md) — StoreKit 2 design
4. [`../claude/api/contracts.md`](../claude/api/contracts.md) — every endpoint
5. [`../claude/design/tokens.md`](../claude/design/tokens.md) — colors, type, components

## Hard rules

- iOS 26 deployment target, Swift 6, SwiftUI only.
- All work on `main`. No branches.
- Brand color sage green `#4A7A5C`. Severity signals only for yellow/orange/red.
- Sharp 2px corners, UPPERCASE mono labels. No glass, no blur.
- Supabase ref `pwvtjuklkfelpxzxjmsi` — same DB as the web app.
- AI keys never ship in the binary. Always proxy via `landing/`.
