# ADR — Monorepo restructure (2026-05-15)

## Decision

Split the Green Flagged repo into three top-level directories:

```
ContractChecker/
├── landing/    # Next.js 16 app (was repo root)
├── ios/        # SwiftUI app (new)
└── claude/     # Docs, ADRs, prompts, design source
```

## Why

The Next.js app was at the repo root. Adding a native iOS app would have mixed
two unrelated build systems (pnpm + Next.js vs Xcode + SwiftPM) and made the
root noisy with `.xcodeproj`, `Pods/`, `DerivedData/`, etc.

A monorepo with named subdirectories:
- keeps each toolchain to its own folder
- gives the iOS team an obvious entry point
- collects all cross-client specs in `claude/` (API contracts, design tokens,
  ADRs) where neither client owns them
- preserves git history via `git mv`

## What moved

| Old | New |
|---|---|
| `app/`, `components/`, `lib/`, `public/`, `supabase/`, `content/`, `archive/` | `landing/` |
| `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `next.config.ts`, `proxy.ts`, `vercel.json`, `postcss.config.mjs`, `eslint.config.mjs`, `.env.example` | `landing/` |
| `README.md` (Next.js-specific) | `landing/README.md` |
| `docs/` | `claude/product/from-explanation/` |
| `buttons.md` | `claude/design/buttons-reference.md` |
| `GreenFlagged Design System/` | `claude/design/source/` (gitignored, local-only) |
| `prompt7..14.md` | `claude/prompts/` (gitignored) |
| `OG image _ 1200 _ 630.png`, `greenlogo.png`, `greensvg.svg` | `landing/public/` |
| `ascii-art (11).avif`, `ascii-art (12).avif` | `claude/scratch/` |

New at the root:
- `README.md` — monorepo overview
- `pnpm-workspace.yaml` — workspace = `["landing"]`
- `AGENTS.md` — top-level agent rules pointing into each dir

`.gitignore` rewritten to scope existing ignores under `landing/` and add
Xcode/SwiftPM patterns under `ios/`.

## Vercel implication

Vercel project must change Root Directory from `./` to `landing`:

1. Vercel dashboard → Green Flagged project → Settings → Build & Development
2. Root Directory → set to `landing`
3. Save → redeploy

The next push to `main` after the restructure commit will fail until that
setting flips. Acceptable downtime: ~2 minutes.

## What didn't move

- `.git/` — stays at the new root (history preserved across the moves).
- `.claude/` — Claude Code state, stays at root, gitignored.
- `CLAUDE.md`, `AGENTS.md` — stay at root, content updated.
- Supabase project ref `pwvtjuklkfelpxzxjmsi` — unchanged. Both clients
  point at the same instance.

## Rollback

If the restructure breaks production, revert the single commit on `main` and
flip Vercel Root Directory back to `./`. All file moves are tracked by `git mv`,
so a `git revert` restores the prior layout cleanly.

## Follow-ups

- [ ] Vercel root-directory flip (Roman, after deploy)
- [ ] Apple Developer account + App Store Connect app creation (Roman)
- [ ] `landing/app/api/billing/apple/*` endpoints (Phase 6)
- [ ] Migration `0012_apple_iap.sql` (Phase 6)
- [ ] iOS app scaffolding (Phase 1+ — see `ios/PROMPT.md` for the kickoff)
