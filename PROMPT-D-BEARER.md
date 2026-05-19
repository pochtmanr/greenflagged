# PROMPT D — landing-side Bearer auth helper

**Working directory:** `/Users/romanpochtman/Developer/ContractChecker/landing/`
**Suggested agent:** `frontend-developer` or `general-purpose`
**Depends on:** nothing
**Blocks:** nothing (this is plumbing for a follow-up session that retrofits routes)

---

## Read first

- `claude/api/bearer-auth.md` — gives the exact diff for both files
- `AGENTS.md` — Next 16, App Router, pnpm, git stays on `main`
- `landing/lib/supabase/server.ts` — current state (cookie-based only)
- `landing/proxy.ts` — current state (Next 16 middleware, function name is `proxy` not `middleware`)

## Goal

Add `getSupabaseFromRequest()` so the iOS app can authenticate `/api/*` routes with `Authorization: Bearer <jwt>`. Existing cookie-based web auth must be untouched. **Do not retrofit existing routes today** — that's a follow-up session. This prompt only lands the plumbing.

## Tasks

1. **Edit `landing/lib/supabase/server.ts`:**
   - Ensure `import { headers } from "next/headers"` is at the top (if not already present).
   - Ensure `import { createServerClient } from "@supabase/ssr"` is at the top (likely already present).
   - Append a new `getSupabaseFromRequest()` function exactly as shown in `claude/api/bearer-auth.md` lines 13–33. It must:
     - Read the `authorization` header from `next/headers`.
     - If the value starts with `Bearer `, create a new `createServerClient` with `cookies: { getAll: () => [], setAll: () => {} }` and `global.headers.Authorization` set to the Bearer string.
     - Else, fall back to `getSupabaseServer()` (the existing cookie-based path).
   - Export it alongside existing exports.
   - Add a one-line comment above the new function:
     ```
     // Used by iOS-callable API routes. Next retrofit targets:
     // /api/scan, /api/contracts/draft, /api/contracts/improve,
     // /api/contracts/[id], /api/contracts/[id]/pdf, /api/business-profiles
     ```

2. **Edit `landing/proxy.ts`:**
   - At the very top of `proxy(request: NextRequest)`, before any existing logic, add the Bearer-passthrough per `claude/api/bearer-auth.md` lines 53–57:
     ```ts
     const auth = request.headers.get("authorization");
     if (auth?.startsWith("Bearer ") && request.nextUrl.pathname.startsWith("/api/")) {
         return NextResponse.next();
     }
     ```
   - Ensure `NextResponse` is imported (likely already is).
   - **Do not modify** `APP_PATHS`, `PUBLIC_AUTH_PATHS`, or any other gating logic. Cookie-based web auth flow must be untouched.

3. **Verify locally:**
   - `pnpm tsc --noEmit` — must be clean.
   - `pnpm build` — Next 16 Turbopack build must succeed, all routes still compile, no new warnings.
   - `pnpm dev` — start dev server, hit `http://localhost:3000` from a browser, sign in via the existing flow, confirm `/dashboard` still loads. Cookie path must be untouched.

## Constraints

- Service-role key must NEVER appear in `getSupabaseFromRequest()`. Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` only — the Bearer JWT itself carries the user identity; RLS does the rest.
- Do not commit `.env*` or any secret.
- Do not retrofit existing API routes today. Adding the helper without consumers is the whole point — the next session wires iOS clients and switches those specific routes to the new helper.
- Git: stay on `main`. No PR, no branches.

## Verification

1. `pnpm tsc --noEmit` clean.
2. `pnpm build` clean.
3. `pnpm dev` runs, browser sign-in works, `/dashboard` loads.
4. `grep -n "getSupabaseFromRequest" landing/lib/supabase/server.ts` returns a hit on the export.
5. `grep -n "Bearer " landing/proxy.ts` returns a hit on the early-return.
6. No existing API route file under `landing/app/api/` has been modified.

## Out of scope for this prompt

- Retrofitting routes to use the new helper — next session
- Anything in `ios/` — Prompts A, B, C
- New API routes (e.g., `/api/billing/apple/webhook`) — Phase 6 / billing session
