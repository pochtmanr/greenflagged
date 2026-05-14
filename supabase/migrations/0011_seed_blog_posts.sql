-- 0011_seed_blog_posts.sql
-- Seed the launch set of blog posts. Idempotent — re-running won't duplicate.
-- Bodies are markdown; rendered by react-markdown on /blog/[slug].

insert into public.blog_posts
  (slug, title, description, body_md, cover_image_url, author_name, tags, reading_minutes, published_at)
values
(
  '10-red-flags-in-freelance-contracts',
  '10 red flags in freelance contracts (and the language that fixes them)',
  'The ten clauses that wreck freelance contracts, the unfair language to watch for, and the redline wording that fixes each one.',
  $body$
Freelance contracts are written by clients, not for freelancers. The same ten clauses show up in every template, and the same ten clauses cause every dispute. Here's what to look for and the redline wording that fixes each one.

## 1. Payment terms

**Bad:** "Payment within Net 60 of the end-of-month invoice."

**Why it's a problem:** Net 60 from end-of-month is effectively 75-90 days. You are financing the client at zero interest.

**Fix:** "Payment within fourteen (14) days of invoice. Late fees of 1.5% per month accrue on overdue balances."

## 2. Scope and revisions

**Bad:** "Provider will deliver such revisions as the Client may reasonably request."

**Why it's a problem:** "Reasonably" is the most expensive word in any freelance contract. Without a numeric cap, every project becomes unbounded.

**Fix:** "Up to two (2) rounds of revision are included in the Project Fee. Additional revision rounds are billed at the Provider's standard hourly rate."

## 3. IP transfer timing

**Bad:** "All intellectual property rights transfer to the Client upon execution of this Agreement."

**Why it's a problem:** If you assign IP at signature, an unpaid invoice means you've given away the work for free.

**Fix:** "All intellectual property in the Deliverables transfers to the Client upon receipt of final payment in full."

## 4. Kill fee

**Bad:** "Client may terminate this Agreement at any time. Provider will be compensated for hours worked through the date of termination."

**Why it's a problem:** No kill fee, no protection against last-minute terminations after you've turned down other work.

**Fix:** "On termination by the Client without cause, Provider is entitled to (i) all fees for work completed to date, plus (ii) a kill fee equal to 30% of the unbilled remainder of the Project Fee."

## 5. Non-compete and non-solicit

**Bad:** "Provider will not perform services for any competitor of Client for a period of twenty-four (24) months."

**Why it's a problem:** Broad post-engagement non-competes are increasingly unenforceable, and either way they're a major red flag.

**Fix:** Narrow the scope to specific named competitors, narrow the geography, cap at 6-12 months, or strike entirely.

## 6. Indemnification

**Bad:** "Provider shall indemnify Client against any and all losses arising out of this Agreement."

**Why it's a problem:** Uncapped indemnity exposes you to losses far beyond the fee.

**Fix:** "Provider's total cumulative liability under this Agreement is capped at fees actually received hereunder."

## 7. Acceptance criteria

**Bad:** "Deliverables are subject to Client's reasonable satisfaction."

**Why it's a problem:** Subjective acceptance means payment can be withheld for any reason.

**Fix:** "Acceptance criteria are listed in Schedule A. Deliverables meeting those criteria are deemed accepted within ten (10) business days of delivery."

## 8. Confidentiality term

**Bad:** "Provider's confidentiality obligations under this Agreement are perpetual."

**Why it's a problem:** Permanent confidentiality with no carve-outs follows you forever.

**Fix:** "Confidentiality obligations continue for three (3) years after termination, except for trade secrets, which continue while they remain trade secrets."

## 9. Auto-renewal

**Bad:** "This Agreement renews automatically for additional one-year terms unless terminated with 90 days' written notice."

**Why it's a problem:** The 90-day window is designed to be missed.

**Fix:** "Either party may terminate this Agreement on thirty (30) days' written notice for any reason, without penalty."

## 10. Dispute resolution

**Bad:** "Any dispute shall be resolved exclusively in the courts of the Client's home jurisdiction."

**Why it's a problem:** If you're in Germany and the client is in California, this clause makes disputes economically impossible to pursue.

**Fix:** "Disputes shall be resolved in the courts of the Provider's home jurisdiction" — or mutually agreed arbitration with a neutral seat.

---

Want Green Flagged to scan your next contract against this list automatically? [Drop the PDF here](/scan) and get a clause-by-clause verdict in two minutes.
$body$,
  '/blog/cover-01.avif',
  'Green Flagged',
  array['freelance', 'contracts', 'negotiation'],
  6,
  '2026-05-12T10:00:00Z'
),
(
  'how-to-spot-an-unfair-nda',
  'How to spot an unfair NDA before you sign',
  'Eight red flags that turn a routine NDA into a gag order — and the carve-outs every reasonable NDA should already have.',
  $body$
Most NDAs you'll be asked to sign are templates. Templates are written for the disclosing party, not for you. Here's how to read one in five minutes and catch the eight patterns that turn a routine NDA into a long-term liability.

## What an NDA actually is

A non-disclosure agreement does one thing: defines what information is confidential and what obligations the recipient has with respect to that information. Everything else — non-competes, exclusivity, residuals, jurisdiction — is bolted on, and that's where the problems live.

## The eight red flags

**1. Overbroad definition of "Confidential Information."** Watch for "all information disclosed by Discloser, in any form, whether marked or not." This sweeps in things you already know, things in the public domain, and things you'll develop independently.

**2. Perpetual term with no trade-secret carve-out.** Reasonable: 2-5 years for general confidential information, perpetual for trade secrets specifically. Unreasonable: perpetual for everything.

**3. No standard carve-outs.** Every fair NDA carves out information that (a) is already in the public domain, (b) was already known to the recipient, (c) is independently developed without reference to the disclosed information, or (d) is compelled to be disclosed by law. If these aren't in your NDA, you're being asked to be omniscient.

**4. No residuals clause for unaided memory.** Without it, a court could find you in breach for remembering what you read. Standard residuals: "Recipient may use ideas, concepts, and know-how retained in unaided memory."

**5. One-way obligations in a two-way conversation.** If both parties are exchanging information, the NDA must be mutual. One-way NDAs in mutual conversations are a leverage play.

**6. Liquidated damages or no-bond injunctive relief.** "Recipient agrees that breach will cause irreparable harm and consents to injunctive relief without bond." This tilts enforcement against you and is sometimes used as a negotiating club.

**7. Embedded non-compete or non-solicit.** Some NDAs include "Recipient shall not engage in competing activities for X years." This is a non-compete masquerading as confidentiality protection.

**8. Foreign jurisdiction with exclusive forum selection.** If you're in Berlin and the NDA forces disputes into Delaware Chancery Court, the cost of litigation alone is the penalty.

## The clauses you want to see

- Defined term, ideally 2-5 years.
- Specific definition of confidential information ("marked confidential" or "identified as such at disclosure").
- Standard carve-outs (public domain, already known, independently developed, compelled by law).
- Residuals clause for unaided memory.
- Mutual obligations if exchange is mutual.
- Return-or-destroy at termination, with a backups exception.
- Governing law in a neutral or mutual jurisdiction.

## What to do when you see a red flag

Push back. NDAs are negotiable, and most are negotiated within an hour by email. Specific edits:

> "Please limit the definition of Confidential Information to information marked 'CONFIDENTIAL' or identified as such at the time of disclosure."

> "Please add the standard carve-outs for (a) information already in the public domain, (b) information already known to the Receiving Party, (c) information independently developed, and (d) information compelled to be disclosed by law."

> "Please limit the term of confidentiality to three years from disclosure, with perpetual protection only for trade secrets."

Most counsel will accept these edits without comment. The ones who don't are showing you something about how they'll behave throughout the relationship.

---

Want Green Flagged to check your next NDA against the full checklist automatically? [Scan it here](/scan) and get a verdict in two minutes.
$body$,
  '/blog/cover-02.avif',
  'Green Flagged',
  array['nda', 'contracts', 'legal'],
  5,
  '2026-05-10T10:00:00Z'
),
(
  'safes-explained-founder-pitfalls',
  'SAFEs explained: where founders give up more than they realize',
  'SAFE notes look simple. The dilution math is not. A founder''s field guide to valuation caps, MFN, pro-rata, and the post-money trap.',
  $body$
SAFE (Simple Agreement for Future Equity) notes were invented by Y Combinator to make pre-seed investment fast. They are not, however, simple. Here's what founders need to know before signing — and where the real dilution lives.

## What a SAFE actually is

A SAFE is a contract that converts into preferred stock at a future priced round. The investor pays now, gets shares later, at terms defined by the SAFE: typically a **valuation cap**, a **discount**, or both.

## Pre-money vs post-money SAFE — the most important distinction

YC released a **post-money** SAFE in 2018. It looks similar to the pre-money version but the dilution math is dramatically different.

**Pre-money SAFE:** Your cap is the pre-money valuation. New investors' percentages dilute SAFE holders' percentages, and vice versa. Everyone shares the dilution from the priced round.

**Post-money SAFE:** Your cap is the post-money valuation. SAFE holders' percentages are locked in *after* SAFE conversion but *before* the priced round. The result: subsequent SAFE rounds and the priced round dilute *the founders*, not the SAFE holders.

If you sign multiple post-money SAFEs at different caps, the dilution compounds against you in a way that's invisible until conversion.

**Founder's rule:** Model the cap table before signing each SAFE. Use a tool, a spreadsheet, anything — but don't sign on vibes.

## The valuation cap

The cap is the maximum valuation at which the SAFE converts. If your priced round is at $15M post-money and the SAFE cap is $8M, the SAFE converts as if the company were valued at $8M — meaning the investor gets a meaningfully larger percentage than the $15M investors.

Lower cap = better for the investor, worse for you.

## The discount

A discount lets the SAFE convert at a percentage off the priced-round price. Typical: 20%. If you have both a cap and a discount, the SAFE uses whichever gives the investor more shares.

## MFN — Most Favored Nation

An MFN clause lets the SAFE holder swap in any more-favorable terms you grant to a later investor. Translation: if you sell a later SAFE at a lower cap, the MFN-holder can change their cap to match.

Sometimes reasonable, sometimes a trap. The trap: if you raise an emergency bridge at a low cap, every MFN-holder ratchets down. Negotiate the MFN to apply only to SAFEs of a similar size or class.

## Pro-rata rights

Pro-rata rights let the SAFE holder maintain their percentage in future rounds by investing alongside new investors. Reasonable for serious investors; unreasonable as a default for small checks.

The 2018 post-money SAFE separates pro-rata into a side letter. If you're using the older form, watch for it embedded in the SAFE itself.

## The "stacking" problem

If you sign post-money SAFEs at $5M cap, then $8M cap, then $12M cap before a priced round at $20M, each SAFE converts based on its own cap. The combined ownership of the SAFEs is much larger than founders expect, because each cap was applied independently.

Always run the math before each new SAFE. Online stacking calculators are free.

## What to negotiate

- **Cap** — the single biggest lever. The investor wants it low; you want it high.
- **Discount** — secondary. 20% is standard.
- **MFN** — limit to similar-size SAFEs; otherwise expect ratchets.
- **Pro-rata** — say no by default; grant selectively in side letters.
- **Choice of pre-money vs post-money** — if you have any negotiating leverage, prefer pre-money.

## What to avoid

- Granting pro-rata to every angel.
- Signing post-money SAFEs at multiple decreasing caps.
- Ignoring the MFN clause.
- Not modeling the priced-round cap table before signing.

---

Want Green Flagged to read your next SAFE and tell you where the dilution actually goes? [Drop the PDF here](/scan).
$body$,
  '/blog/cover-03.avif',
  'Green Flagged',
  array['startups', 'fundraising', 'safe-notes'],
  7,
  '2026-05-08T10:00:00Z'
),
(
  'brand-deal-exclusivity-whats-negotiable',
  'Brand deal exclusivity: what''s negotiable and what isn''t',
  'A creator''s playbook for negotiating exclusivity windows, category definitions, and post-campaign usage rights without leaving money on the table.',
  $body$
Brand deal contracts come with exclusivity clauses by default. Most of them are negotiable. Here's the playbook creators should be using before they accept the first offer.

## What exclusivity actually means

In a brand deal, exclusivity restricts you from working with competitors of the sponsoring brand for a defined period. The four levers are:

1. **Category breadth** — how narrowly the competitor set is defined
2. **Time window** — how long the restriction lasts
3. **Geography** — which markets it applies in
4. **Channels** — which platforms it covers

Brands negotiate hard on all four. Creators usually negotiate on none.

## The three exclusivity questions every creator should ask

### 1. How narrow is the category?

**Bad:** "Beauty and personal care."

**Why:** That's half the brands in your niche.

**Better:** "Mass-market lipstick brands sold in drugstores in the US."

Push the brand to define the category as narrowly as the product. A lipstick brand doesn't need exclusivity from skincare, fragrance, or even premium lipstick.

### 2. How long is the window?

**Bad:** "Six months after the final post."

**Why:** You can post the deliverables and still be locked out of competing brands long after the campaign value is realized.

**Better:** Exclusivity matches the active campaign window — typically 30-90 days. Anything beyond that should be **paid separately**.

A useful frame: "Inside-the-window exclusivity is included. Outside-the-window exclusivity is a separate paid right."

### 3. Are usage rights perpetual?

**Bad:** "Brand may use Content in perpetuity, in all media now known or hereafter invented."

**Why:** The brand can run your content in TV ads, billboards, or paid social, two years from now, for no additional fee.

**Better:** "License for twelve (12) months, in the channels listed in Exhibit A, with renewal at the same fee."

## The non-negotiables (don't waste leverage here)

- **Brand approval rights.** They paid; they get to approve. Just ensure the approval window has an SLA (5-7 business days, deemed-approved if no response).
- **FTC / ASA / advertising disclosure requirements.** Non-negotiable; required by law.
- **Morality clauses for specific illegal or hate-related conduct.** Reasonable. Negotiate them down to specifically listed conduct, but don't strike them.

## The hidden value: whitelisting

Whitelisting (the brand running paid ads from your handle) is a separate paid right. It is **not** included in your base fee. Industry rule of thumb: 10-20% of the brand's ad spend on the whitelisted content, paid to the creator.

If the contract says nothing about whitelisting, the brand will assume they can do it. Add the clause yourself:

> "Whitelisting / paid amplification from Creator's account is a separate paid right. Brand may not run paid promotion through Creator's handle without a separate written agreement and additional consideration."

## Sample negotiation language

For exclusivity:

> "Exclusivity is limited to direct competitors in the [specific product category] segment, in the [specific geographic markets], for the active campaign window of [N] days from final post. Extended exclusivity is available at additional cost as set out in Exhibit B."

For usage:

> "Brand receives a non-exclusive, non-transferable license to use the Content in the channels listed in Exhibit A for twelve (12) months. Renewal is available at the same fee for a further twelve months. Use outside the listed channels (including but not limited to paid amplification, TV, OOH, and OEM packaging) is a separate paid right."

For approvals:

> "Brand has five (5) business days to review and approve Content. If no response is received in that window, Content is deemed approved. One round of revision is included."

## What changed in 2026

Two things to know:

1. **AI-generated content disclosure** is increasingly required by brand contracts (and by EU AI Act §50). If your content uses AI tools, the contract should specify what you'll disclose and how.
2. **Platform-shutdown clauses.** TikTok ban scares in 2024-2025 added clauses for what happens if a platform becomes unavailable. Mutual rights to terminate or substitute, no penalty.

---

Want Green Flagged to scan your next brand deal against this checklist? [Drop the PDF here](/scan) and get a verdict in two minutes.
$body$,
  '/blog/cover-04.avif',
  'Green Flagged',
  array['creators', 'brand-deals', 'influencer'],
  6,
  '2026-05-05T10:00:00Z'
),
(
  'werkvertrag-vs-dienstvertrag-germany',
  'Werkvertrag vs Dienstvertrag: what changes for freelancers in Germany',
  'A practical guide for freelancers and contractors working in Germany — the legal difference between Werkvertrag and Dienstvertrag, and why it matters for your contract.',
  $body$
If you work as a freelancer in Germany, the difference between a *Werkvertrag* and a *Dienstvertrag* is not a paperwork detail — it changes how you get paid, who owns what you produce, and whether you can be classified as a *Scheinselbstständiger* (false self-employed person) by the tax authorities.

## The legal core

**Dienstvertrag** (§ 611 BGB): You owe **services**. The client pays for your time and effort. You are not on the hook for a specific result.

**Werkvertrag** (§ 631 BGB): You owe a **result**. The client pays for a defined deliverable that meets defined acceptance criteria. If the result is defective, you fix it at your own cost.

The choice affects six things in practice.

## 1. Payment trigger

- **Dienstvertrag:** Pay as you go — hourly, daily, monthly, agreed cadence.
- **Werkvertrag:** Pay on *Abnahme* (formal acceptance) of the deliverable. § 640 BGB.

This is why so many freelance disputes in Germany hinge on whether *Abnahme* has happened: under a Werkvertrag, no acceptance, no payment.

## 2. Warranty and rework

- **Dienstvertrag:** No statutory warranty. If the client doesn't like the result, that's their risk.
- **Werkvertrag:** Two-year statutory warranty (§ 634a Abs. 1 Nr. 1 BGB for movable works; five years for buildings). You owe free rework if the result is defective.

Translation: a Werkvertrag puts the quality risk on you, a Dienstvertrag puts it on the client.

## 3. IP and ownership

In both contracts, IP must be assigned explicitly — it does not pass automatically. § 31 UrhG governs author's rights, which are unassignable but licensable.

For a Werkvertrag, the work-product is typically licensed broadly to the client on Abnahme. For a Dienstvertrag, IP terms are independent and need their own clause.

## 4. Scheinselbstständigkeit

This is the term you'll hear most often: it means the tax and social-insurance authorities (Deutsche Rentenversicherung, Finanzamt) treat what looks like freelancing as disguised employment. Indicators:

- You work primarily for one client.
- You don't bear entrepreneurial risk.
- The client controls your hours, location, and tools.
- You're integrated into the client's organizational structure.
- You don't have other clients or your own marketing.

If you're reclassified, **back social contributions** (Sozialversicherungsbeiträge) can be owed for up to four years — for both you and the client.

A clearly-drafted Werkvertrag with defined deliverables and independent execution is one of the strongest defenses against Scheinselbstständigkeit. A vague Dienstvertrag that pays hourly and has you working on-site full-time is a major risk indicator.

## 5. Termination

- **Dienstvertrag:** Free termination is the default unless restricted by contract (§ 621 BGB).
- **Werkvertrag:** Client may terminate at any time before completion, but you're entitled to the agreed price minus your saved costs (§ 648 BGB).

## 6. Which one should be in your contract?

The honest answer: whichever matches the substance.

- If the deliverable is a defined, completable thing (a piece of software, a translated document, a designed website), the contract is a *Werkvertrag* in substance regardless of what the document is titled.
- If you're providing ongoing services (consulting, training, retainer work), it's a *Dienstvertrag*.

German courts look at substance over form. Labeling a working relationship as a *Werkvertrag* doesn't protect you if it's structurally a *Dienstvertrag* or, worse, employment.

## What to negotiate

In a **Werkvertrag**:

- Define the deliverable specifically (Schedule A / *Leistungsbeschreibung*).
- Define acceptance criteria objectively.
- Set a maximum review window for Abnahme (e.g., 10 working days, deemed-accepted if no response).
- Cap warranty rework at the original fee.
- Tie IP assignment to full payment.

In a **Dienstvertrag**:

- Define scope and capacity (hours per week, capped or floored).
- Define termination notice (minimum 14 days, ideally 30).
- Avoid clauses that read as employment (paid holiday, sick pay, exclusivity, integration into the client's hierarchy).
- Include a written statement that you're an independent contractor under § 7 SGB IV.

## The wrong contract type costs real money

Two real-world consequences:

- **Wrong Werkvertrag:** A client withholds final payment claiming the deliverable is defective. You have to litigate to recover, with the warranty period running against you.
- **Wrong Dienstvertrag:** Five years later, the Rentenversicherung audits and assesses back contributions. You owe your share, the client owes theirs, both are angry.

A two-page review by a freelance-friendly *Fachanwalt für Arbeitsrecht* before signing is one of the highest-leverage investments a German freelancer can make.

---

Working in Germany and want a sanity check on your next contract? Green Flagged flags Werkvertrag/Dienstvertrag inconsistencies, Scheinselbstständigkeit indicators, and standard German clause issues. [Drop the PDF here](/scan).
$body$,
  '/blog/cover-05.avif',
  'Green Flagged',
  array['germany', 'freelance', 'werkvertrag', 'dienstvertrag'],
  8,
  '2026-05-02T10:00:00Z'
)
on conflict (slug) do nothing;
