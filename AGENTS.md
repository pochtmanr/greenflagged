# Agent rules — Green Flagged monorepo

## Repo layout

- `landing/` — Next.js 16 app (App Router, Turbopack, Tailwind v4, Supabase).
- `ios/` — Native SwiftUI app, iOS 26+, Xcode 16.
- `claude/` — Specs, ADRs, API contracts, design tokens, prompts.

## Before any UI work

Query MemPalace first:

```
mempalace search "<topic>" --wing greenflagged --room design
```

Or via MCP: `mempalace_search` with `wing: "greenflagged"`, `room: "design"`.
The drawers there override generic design instincts.

Non-negotiable design rules (also in [`claude/design/tokens.md`](claude/design/tokens.md)):
- Nav-on-scroll, cookie banner, and the hero chip are SOLID — no `backdrop-blur`.
- Green is the only decorative color. Blue/yellow/red/purple are signals only
  (severity, status, badge tier).
- Sharp 2px corners everywhere, UPPERCASE mono labels, dark `#121212` bg.
- Inter for body, JetBrains Mono for labels and code.

## landing/ specifics

This Next.js install is NOT what your training data remembers. Read
`landing/node_modules/next/dist/docs/` for the guide that matches the installed
version before non-trivial changes. Heed deprecation notices.

- pnpm workspace; commands run from `landing/`: `pnpm dev`, `pnpm build`,
  `pnpm tsc --noEmit`.
- Auth pages live under `landing/app/(auth)/`. Marketing under
  `landing/app/(marketing)/`. App under `landing/app/(app)/`.
- Server routes auth via `getSupabaseServer()`. Mobile clients send
  `Authorization: Bearer <access_token>` — see [`claude/api/bearer-auth.md`](claude/api/bearer-auth.md).

## ios/ specifics

- iOS 26 deployment target. Swift 6, SwiftUI, `@Observable` macro.
- No third-party state lib. Apple's Observable + NavigationStack is enough.
- All Anthropic / OpenAI calls stay server-side. Mobile hits `landing/`'s API
  with a Supabase JWT, never an AI provider key.
- Billing: StoreKit 2 only. Web's Revolut/OxaPay flow is web-only. See
  [`claude/ios/billing-iap.md`](claude/ios/billing-iap.md).

## Git workflow (HARD RULE)

1. All work on `main`. No `feat/*`, no `fix/*`, no PRs.
2. Never `git checkout -b` or `git switch -c`.
3. If a session inherits a non-main branch: fast-forward `main`, push, delete the side branch.
4. Worktrees are fine; the branch inside must still merge to `main` immediately.

## Never

- Hardcode credentials, API keys, URLs, or ports. Read from env. Fail loudly.
- Commit `.env*` or `Secrets.xcconfig`.
- Add new accent colors unless they represent a signal.
- Run `expo prebuild --clean` — different project; the rule still stands: no
  destructive build resets without explicit confirmation.
