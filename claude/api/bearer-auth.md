# Bearer-token auth for landing/ APIs

The iOS app authenticates with Supabase and holds an access token (JWT). It
calls `landing/`'s API routes with that token in the `Authorization` header.
The web app uses cookies; both must work.

## Required change in `landing/lib/supabase/server.ts`

Today `getSupabaseServer()` reads cookies via Next 16's `cookies()`. Add a
helper that prefers a Bearer token when present, falls back to cookies otherwise.

```ts
// landing/lib/supabase/server.ts
import { headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function getSupabaseFromRequest() {
  const h = await headers();
  const auth = h.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7);
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: { getAll: () => [], setAll: () => {} },
        global: { headers: { Authorization: `Bearer ${token}` } },
      },
    );
  }
  return getSupabaseServer();   // existing cookie-based path
}
```

## Use it in mobile-callable routes

```ts
// landing/app/api/scan/route.ts
const supabase = await getSupabaseFromRequest();
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
```

That's it. Cookie clients pass through identically; mobile clients now work.

## proxy.ts (Next 16 middleware)

`proxy.ts` should skip Bearer-token API requests entirely — the route handler
re-validates anyway. Add to the matcher exclusions:

```ts
// landing/proxy.ts — at top of proxy()
const auth = request.headers.get("authorization");
if (auth?.startsWith("Bearer ") && request.nextUrl.pathname.startsWith("/api/")) {
  return NextResponse.next();
}
```

## CORS

Mobile is not subject to browser CORS, so no `Access-Control-*` headers are
strictly required for the iOS app. But during development against `localhost:3000`
from a simulator, ensure the route returns plain JSON (no implicit cookie set).

## What does NOT change

- Existing cookie-based auth for the web app — untouched.
- RLS — still the security boundary. The Bearer token is just a different way
  to identify the same user to PostgREST.
- Service-role usage in webhooks/cron — service role never gets exposed to iOS.
