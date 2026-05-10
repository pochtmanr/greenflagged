# Green Flagged

AI contract review for freelancers, agencies, indie founders, and creators.
Drop a contract, get a plain-English verdict in minutes.

This repo currently ships the **marketing site only**. Auth, the analysis
flow, dashboard, and Paddle billing are deferred to a follow-up build (see
`/Users/romanpochtman/.claude/plans/so-i-want-to-keen-orbit.md`).

## Stack

- **Next.js 16** (App Router) + **TypeScript strict**
- **Tailwind CSS v4** with CSS-variable tokens
- **GSAP 3 + ScrollTrigger** for the masked word reveal + section reveals
- **Canvas 2D** dot-matrix particle field (DOM fallback for reduced motion)
- **Radix** primitives (Dialog, Accordion) hand-styled to the design system
- **lucide-react** icons
- **Resend** for email capture + contact form

## Local development

```bash
pnpm install
cp .env.example .env.local   # fill in RESEND_API_KEY, LEAD_TO_EMAIL, MAIL_FROM
pnpm dev
```

Open <http://localhost:3000>.

## Scripts

```bash
pnpm dev        # next dev (turbopack)
pnpm build      # next build
pnpm start      # next start
pnpm lint       # eslint .
```

## Project layout

```
app/
  (marketing)/         # public site (nav + footer wrapper)
    page.tsx           # /
    pricing/           # /pricing
    how-it-works/      # /how-it-works
    use-cases/         # /use-cases
    about/             # /about
    contact/           # /contact
    blog/              # /blog
    (legal)/           # /terms /privacy /imprint /cookies /disclaimer
  api/
    lead/route.ts      # POST email capture
    contact/route.ts   # POST contact form
components/
  layout/              # nav, footer, section, container, scroll-progress
  ui/                  # button, glass-card, gradient-shell, accordion, dialog, input
  brand/               # wordmark, verdict-badge, masked-word-reveal, dot-matrix-canvas
  sections/            # hero, hero-drop-zone, three-step, sample-verdict, ...
content/               # typed copy modules (faq, pricing, clauses)
lib/                   # cn, gsap, resend, email-capture client
docs/                  # source spec markdown (product + design system)
```

## Design system

Source design lives in `docs/Creative-Studio-Branding-Culture-DESIGN.md`.
This project adapts the source palette to **electric mint (`#00E676`)**
on a near-black mint-tinted canvas. All design tokens are declared in
`app/globals.css` and exposed through Tailwind v4's `@theme` block.

Key utilities:

| Utility            | Purpose                                                |
| ------------------ | ------------------------------------------------------ |
| `text-display`     | 128px Inter, -0.04em, UPPER (hero H1)                  |
| `text-display-sm`  | 32–64px Inter, -0.03em, UPPER (section H2)             |
| `text-body`        | 16/24 Inter (base body)                                |
| `text-label`       | 12px UPPER 0.3px (eyebrow / micro labels)              |
| `glass-card`       | 50% bg, 4px blur, 1px border                           |
| `glass-strong`     | 70% bg, 8px blur                                       |
| `gradient-shell`   | Diagonal hairline frame wrap (design.md technique)     |
| `gs-reveal-text`   | Masked GSAP word reveal                                |
| `scroll-progress`  | Top-of-page mint hairline                              |

Severity scale (used in `VerdictBadge`):
`severity-green` `#00E676`, `severity-yellow` `#FFD600`,
`severity-orange` `#FF8A1F`, `severity-red` `#FF3D5C`.

## Brand vocabulary

| Verdict           | Meaning           |
| ----------------- | ----------------- |
| **Green-flagged** | Safe to sign      |
| **Yellow note**   | Worth knowing     |
| **Orange warning**| Negotiate         |
| **Red flag**      | Refuse / rewrite  |

Brand promise: *"Get your contract green-flagged before you sign."*

## Source documents

- `docs/explanation.md` — product spec (pages, pricing, features, legal)
- `docs/Creative-Studio-Branding-Culture-DESIGN.md` — design system source

## Out of scope (next build)

Auth (Supabase + Google OAuth), AI analysis (Claude Sonnet + pdf-parse),
dashboard, Paddle billing, dynamic OG images, real blog posts, German
localization.
