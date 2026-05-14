# claude/ — specs, decisions, contracts

Single source of truth for things that span `landing/` and `ios/`. If a fact
lives in only one client's codebase, it'll drift; put it here.

## Index

### API
- [`api/contracts.md`](api/contracts.md) — every endpoint the iOS app hits, request/response shapes, auth, error codes
- [`api/bearer-auth.md`](api/bearer-auth.md) — the small landing/ change that lets mobile clients use Supabase JWTs

### Design
- [`design/tokens.md`](design/tokens.md) — colors, type, spacing, radius — web (.gf-*) → iOS Swift mapping
- [`design/buttons-reference.md`](design/buttons-reference.md) — button variants spec (legacy, still authoritative for both clients)
- `design/source/` — original kit (gitignored, local-only reference)

### iOS
- [`ios/architecture.md`](ios/architecture.md) — module layout, dependencies, conventions
- [`ios/screens.md`](ios/screens.md) — screen-by-screen spec with web parity notes
- [`ios/billing-iap.md`](ios/billing-iap.md) — StoreKit 2 products, server reconciliation

### Product
- `product/from-explanation/` — original product spec + design system source markdown

### Ops
- [`ops/restructure.md`](ops/restructure.md) — ADR: monorepo split (landing/ + ios/ + claude/)

### Prompts (gitignored)
- `prompts/` — phase prompts (1 through 14) kept local for reference. Not source.

## Conventions

- Decisions go in `ops/` as dated ADRs, one per file.
- API + design docs are living — update them as schemas/tokens change.
- iOS-specific implementation notes live in `ios/`. Cross-client facts live in `api/` or `design/`.
- Save material decisions back to MemPalace `wing=greenflagged` so they survive across sessions.
