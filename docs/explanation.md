Contract Red-Flag Checker
Product & Pricing Planning Document
 
Overview

A web app where freelancers, small business owners, and contractors upload a client contract (PDF or pasted text) and receive an AI-generated report highlighting risky clauses in plain language. Each flagged clause is categorized by severity, explained simply, and includes suggested redline language.
 
Target Users

• Freelancers and independent contractors signing client agreements
• Small agencies reviewing vendor or partnership contracts
• Indie founders signing investor SAFEs, advisor agreements, or supplier contracts
• Creators signing brand deal contracts and IP agreements
 
Core Value Proposition

"Don't sign anything risky. Get a 5-minute legal review for the price of a coffee."
 
Pricing Structure

Tier 1 — Pay Per Contract

• Price: €9 per contract
• What's included: One contract analysis, full red-flag report, plain-language explanations, suggested edits, PDF export
• Use case: First-time users, occasional reviewers, those who want to test before subscribing
 
Tier 2 — Freelancer Plan

• Price: €15 / month
• What's included: Unlimited contract analyses, history of past reviews, ability to compare two contracts side-by-side, email support
• Use case: Active freelancers signing contracts regularly
 
Tier 3 — Pro / Agency Plan

• Price: €39 / month
• What's included: Everything in Freelancer + team seats (up to 3 users), custom risk profiles (e.g., "flag all IP transfer clauses for me"), priority AI processing, contract templates library, API access (limited)
• Use case: Agencies, small legal-adjacent teams, consultancies
 
Free Tier (Lead Magnet)

• One free contract analysis per email signup
• Limited to first page or first 2,000 words
• Watermarked report
• Purpose: Drive conversions to paid tiers
 
Pricing Notes

• All prices in EUR; show USD/GBP equivalents based on user IP
• Annual billing discount: 2 months free (€150/year for Freelancer, €390/year for Pro)
• Process payments via Paddle (already onboarded)
• Add 19% VAT for German customers automatically
 
Pages to Build

Public Pages

1. Landing Page (/)
• Hero: "Don't sign that contract until you've checked it"
• 3-step explainer: Upload → AI analyzes → Get red-flag report
• Sample report screenshot/preview
• Trust signals: "Reviewed 10,000+ contracts" (once true)
• Pricing section (3 tiers)
• FAQ
• CTA: "Try one contract free"
 
2. Pricing Page (/pricing)
• Detailed comparison table of all 3 tiers
• Annual vs monthly toggle
• Money-back guarantee statement
 
3. How It Works (/how-it-works)
• Step-by-step walkthrough with screenshots
• List of clause types detected (IP, payment, liability, termination, NDA, etc.)
• What the AI does NOT do (disclaimer: not legal advice)
 
4. Use Cases (/use-cases)
• For Freelancers
• For Agencies
• For Founders signing SAFEs / investment docs
• For Creators signing brand deals
 
5. Blog (/blog)
• SEO-driven content: "10 red flags in freelance contracts," "How to spot an unfair NDA," etc.
• Drives organic traffic
 
6. Legal Pages
• Terms of Service (/terms)
• Privacy Policy (/privacy)
• Imprint / Impressum (/imprint) — required for German market
• Cookie Policy (/cookies)
• Disclaimer (/disclaimer) — emphasize "not legal advice"
 
7. About (/about)
• Brief origin story, team, mission
 
8. Contact (/contact)
• Email form, support address
 
Auth Pages

9. Sign Up (/signup)
• Email + password OR Google OAuth
• Email verification flow
 
10. Login (/login)
• Standard login form
• Forgot password link
 
11. Forgot Password (/forgot-password)
• Email reset link flow
 
App Pages (Authenticated)

12. Dashboard (/app)
• List of past contract analyses
• "Upload new contract" CTA
• Usage counter (e.g., "Unlimited" for paid, "1 free remaining" for free)
 
13. New Analysis (/app/new)
• Drag-and-drop PDF upload, or paste text area
• Optional: select contract type (NDA, services agreement, employment, etc.)
• Optional: "What are you most worried about?" checkboxes (IP, payment terms, liability, etc.)
• Submit button → loading state → results
 
14. Analysis Result (/app/analysis/[id])
• Original contract text on left, annotated red flags on right
• Severity color coding: red (critical), orange (warning), yellow (note)
• Each flag: clause excerpt, plain-language explanation, suggested rewording
• Export to PDF button
• Share link (optional, password-protected)
 
15. Account Settings (/app/settings)
• Profile info
• Change password
• Notification preferences
 
16. Billing (/app/billing)
• Current plan
• Upgrade/downgrade
• Invoices (Paddle-powered)
• Cancel subscription
 
17. Team (/app/team) — Pro tier only
• Invite team members
• Manage seats
 
Core Features (MVP Scope)

Must Have

• PDF and text input
• AI clause detection and risk scoring (use Claude Sonnet API)
• Plain-language explanations
• Severity classification (critical / warning / note)
• Suggested edits for risky clauses
• PDF export of report
• Email + Google OAuth
• Paddle billing integration
• Stripe-free architecture (use Paddle as merchant of record)
 
Nice to Have (Post-MVP)

• Contract comparison (v1 vs v2)
• Negotiation script generator ("how to ask for changes")
• Industry-specific templates (US freelance, UK consultant, German Werkvertrag, etc.)
• Browser extension to analyze contracts inline (Gmail, Docusign)
• Slack integration
• Multi-language support (start English, then German)
 
Suggested Tech Stack

• Frontend: Next.js 14 (App Router) + Tailwind
• Backend: Next.js API routes + Supabase (Postgres + Auth + Storage)
• AI: Claude Sonnet API for analysis (faster, cheaper than Opus for this volume)
• PDF parsing: pdf-parse or pdfjs-dist
• Payments: Paddle (already onboarded)
• Email: Resend or Postmark
• Hosting: Vercel
• Analytics: Plausible or PostHog
 
Unit Economics (Rough)

• Average contract: ~5,000 words = ~7,500 tokens input
• AI output: ~2,000 tokens
• Cost per analysis (Sonnet): ~€0.05
• Margin on €3 single analysis: ~99%
• Margin on €15 plan with 10 analyses/mo avg: ~97%
• Break-even on paid ads: needs careful tracking via UTM + Paddle webhooks
 
Launch Plan (Suggested)

Week 1-2

• Build MVP (landing + auth + analysis flow + Paddle)
 
Week 3

• Soft launch on Indie Hackers, Reddit (r/freelance, r/Entrepreneur, r/smallbusiness)
• Offer first 50 users free analysis in exchange for testimonial
 
Week 4

• Product Hunt launch
• LinkedIn posts targeting freelancers
 
Month 2+

• SEO blog content
• Affiliate program for freelancer newsletters/communities
• Paid ads on LinkedIn (target: "freelance," "contractor" job titles)
 
Important Legal Notes

• Display "Not legal advice" disclaimer prominently on every analysis
• Add to ToS: tool is informational, no attorney-client relationship
• GDPR: contracts contain sensitive info — encrypt at rest, allow user-initiated deletion
• Consider auto-deletion of contract content after 30/60/90 days (configurable per plan)
• Run Holylabs Ltd as merchant; Paddle handles VAT compliance
 