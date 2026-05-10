<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:mempalace -->
# MemPalace — design standards live here

Before doing any UI / design work in this project, query MemPalace:

```
mempalace search "<topic>" --wing greenflagged
```

Or via MCP: `mempalace_search` with `wing: "greenflagged"`, `room: "design"`.

The `greenflagged/design` room holds the brand color rules, typography, component
map, the landing-hero composition recipe, spacing/radius/motion rules, and the
blur/glass surface policy. Every agent that touches UI in this repo must read
those drawers first — they override generic design instincts.

Key non-obvious rules already encoded:

- Nav-on-scroll, cookie banner, and the hero chip are SOLID — no `backdrop-blur`,
  no opacity. Glass cards (`GlassCard`) still use blur intentionally.
- Green is the only decorative color. Blue / yellow / red / purple are reserved
  for signals (severity, status, badge tiers), not aesthetics.
- Auth-flow pages live under `app/(auth)/`, not under `(marketing)`.

Save new design decisions back into MemPalace under `greenflagged/design` so the
rules compound across sessions.
<!-- END:mempalace -->
