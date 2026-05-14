# Green Flagged — monorepo

AI contract review for freelancers, agencies, indie founders, and creators.
Drop a contract, get a plain-English verdict in minutes.

## Layout

```
ContractChecker/
├── landing/    Next.js 16 web app — marketing + dashboard + API + Supabase migrations
├── ios/        Native SwiftUI app (iOS 26+, Xcode 16)
└── claude/     Specs, decisions, API contracts, design tokens, prompts
```

Everything ships from `main`. No feature branches, no PRs. Vercel auto-deploys
`landing/` from `main`.

## Quick start

### landing/
```bash
cd landing
cp .env.example .env.local   # fill Supabase + Resend + AI keys
pnpm install
pnpm dev                     # http://localhost:3000
```

### ios/
Open `ios/GreenFlagged.xcodeproj` in Xcode 16. Copy `ios/Secrets.xcconfig.example`
to `ios/Secrets.xcconfig` and fill `SUPABASE_URL` + `SUPABASE_ANON_KEY` + `API_BASE_URL`.
Target = iOS 26. Build via ⌘B.

If the project doesn't exist yet, see [`claude/ios/architecture.md`](claude/ios/architecture.md)
and the bootstrap prompt at [`ios/PROMPT.md`](ios/PROMPT.md).

## Docs

- [`claude/README.md`](claude/README.md) — index
- [`claude/api/contracts.md`](claude/api/contracts.md) — every endpoint the iOS app hits
- [`claude/design/tokens.md`](claude/design/tokens.md) — web → iOS token mapping
- [`claude/ios/architecture.md`](claude/ios/architecture.md) — SwiftUI app structure
- [`claude/ios/billing-iap.md`](claude/ios/billing-iap.md) — StoreKit 2 + web pricing parity
- [`claude/ops/restructure.md`](claude/ops/restructure.md) — why this monorepo layout

## Supabase

Project ref `pwvtjuklkfelpxzxjmsi`. Both clients (web + iOS) read/write through
the same schema with RLS enforcement. Migrations live in `landing/supabase/migrations/`.

## Hard rules

1. All work on `main`. No branches.
2. Never hardcode credentials. Read from env. Fail loudly.
3. Brand color is sage green `#4A7A5C`. Non-green colors must be signals
   (severity, status, badge), never decoration.
4. Design rules in MemPalace `wing=greenflagged, room=design` are canonical.
