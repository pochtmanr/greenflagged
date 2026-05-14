import type { FaqItem } from "@/content/faq";

export type CheckType = {
  slug: string;
  /** Page H1 — must contain the target keyword naturally. */
  h1: string;
  /** Browser tab title (Green Flagged is appended via root template). */
  title: string;
  /** ~155 chars, used as meta description AND OG description. */
  description: string;
  /** First paragraph the user (and AI scrapers) sees. 2-3 sentences. */
  lede: string;
  /** Lowercase noun used in body copy: "this NDA", "this lease". */
  noun: string;
  /** Header above the red-flag grid. */
  redFlagsTitle: string;
  /** 8 concrete red flags, one sentence each. */
  redFlags: { title: string; body: string }[];
  /** Clause-by-clause primer. 6 items, 1-2 sentences. */
  clauses: { name: string; body: string }[];
  /** Page-specific FAQ — schema-grade. 5 items. */
  faq: FaqItem[];
  /** Single primary keyword used in OG image overlays etc. */
  targetKeyword: string;
};

const t: Record<string, CheckType> = {
  "nda": {
    slug: "nda",
    h1: "Check an NDA online — AI review in minutes",
    title: "Check an NDA Online — AI NDA Review",
    description:
      "Paste or upload an NDA and get a clause-by-clause AI review in minutes. We flag overbroad scope, perpetual confidentiality, residuals, and one-sided remedies.",
    lede:
      "Most non-disclosure agreements are template-grade and unfair to the recipient. Green Flagged scans every clause against a checklist of NDA-specific risks and tells you in plain English what to push back on before you sign.",
    noun: "this NDA",
    redFlagsTitle: "8 red flags we look for in NDAs",
    redFlags: [
      { title: "Overbroad definition of confidential information", body: "Anything-and-everything definitions sweep in public information, your own prior work, and ideas you bring to the table." },
      { title: "Perpetual confidentiality term", body: "Reasonable NDAs end at 2-5 years for general information; trade secrets are the only legitimate exception." },
      { title: "No carve-outs", body: "Standard carve-outs (already known, independently developed, compelled by law) must be explicit." },
      { title: "No residuals clause for unaided memory", body: "Without a residuals clause, you can be sued for remembering things." },
      { title: "Asymmetric obligations", body: "If both parties are sharing information, the obligations should be mutual — one-way NDAs in mutual conversations are a red flag." },
      { title: "Liquidated damages or injunctive relief without bond", body: "Pre-agreed damages or no-bond injunctions tilt enforcement against you." },
      { title: "Broad non-solicitation or non-compete riders", body: "NDAs are sometimes used as Trojan horses for non-competes that wouldn't stand alone." },
      { title: "Exclusive jurisdiction far from where you live", body: "Forum-selection clauses that force you to litigate in another country effectively immunize the other side." },
    ],
    clauses: [
      { name: "Definition of Confidential Information", body: "Should be limited to information marked or identified as confidential. Watch for catch-all phrases like \"all information disclosed\"." },
      { name: "Permitted Use", body: "Specify the narrow purpose. \"For any business purpose\" is too broad." },
      { name: "Term and Termination", body: "Typical: 2-5 years from disclosure. Trade-secret carve-outs may extend longer for that subset only." },
      { name: "Return / Destruction", body: "Either is fine; both is unenforceable. Include a backups exception." },
      { name: "Carve-outs", body: "Public domain, independently developed, lawfully obtained, compelled disclosure with prior notice." },
      { name: "Governing Law and Venue", body: "Should match your home jurisdiction or a mutually neutral one — not the other side's home turf." },
    ],
    faq: [
      { q: "How long should an NDA last?", a: "Two to five years is standard for general confidential information. Trade secrets can have perpetual protection but only for the trade-secret subset, not the whole NDA." },
      { q: "Should I sign a one-way NDA if we're both sharing information?", a: "No. If both parties exchange confidential information, the NDA must be mutual. Insist on the change — it's a trivial edit." },
      { q: "Is a 'no residuals' clause normal?", a: "It's common in big-company templates but unfair to individuals. A residuals clause that allows you to use information retained in unaided memory is standard and reasonable." },
      { q: "Can an NDA stop me from working in the industry?", a: "An NDA can protect confidential information, but it cannot lawfully function as a non-compete. If the NDA effectively prevents you from working, that's enforceable only in narrow circumstances and is a red flag." },
      { q: "Does Green Flagged check NDAs in jurisdictions other than the US?", a: "Yes. The clause checklist applies globally; jurisdiction-specific notes appear when relevant (UK, EU, Germany)." },
    ],
    targetKeyword: "check NDA online",
  },
  "freelance-contract": {
    slug: "freelance-contract",
    h1: "Check a freelance contract online — AI review",
    title: "Check a Freelance Contract Online",
    description:
      "Upload a freelance or contractor agreement and Green Flagged scans it for unfair payment terms, IP transfer overreach, kill fees, and indemnity traps.",
    lede:
      "Freelance contracts are written by clients, not for freelancers. Green Flagged scans every clause against a checklist built from the patterns that actually trip up independent workers — payment timing, ownership, revisions, and termination.",
    noun: "this freelance contract",
    redFlagsTitle: "8 red flags we look for in freelance contracts",
    redFlags: [
      { title: "Net 60/90 payment terms", body: "Anything past Net 30 transfers your bank into the client's working capital. Push back to Net 14 or 50% upfront." },
      { title: "Total IP assignment with no payment milestone", body: "If you assign all IP on signature instead of on final payment, an unpaid invoice can mean you've given the work away for free." },
      { title: "Unlimited revisions", body: "Without a revision cap, scope creep is built in. Two rounds is standard; more should be billable." },
      { title: "Kill fee under 25%", body: "If the client can terminate without notice, your kill fee should cover the work done plus an opportunity-cost premium." },
      { title: "Broad non-solicit / non-compete", body: "Clients sometimes insert clauses that prevent you from working in adjacent industries. Narrow scope, narrow geography, ≤12 months." },
      { title: "Uncapped indemnification", body: "You shouldn't indemnify against losses larger than the fee. Cap indemnity at the project value." },
      { title: "Auto-renew with short cancellation window", body: "30-day cancel windows on annual auto-renew are designed to be missed." },
      { title: "Vague 'satisfaction' clauses", body: "If payment is conditional on the client being \"satisfied\" without objective criteria, you can be stiffed for any reason." },
    ],
    clauses: [
      { name: "Payment terms and schedule", body: "Net 14 with milestones is freelancer-friendly. Net 60+ is a financing burden you're not getting paid for." },
      { name: "Scope and deliverables", body: "Specific outputs, specific revision rounds, specific acceptance criteria. \"As needed\" is a red flag." },
      { name: "IP ownership and transfer", body: "Transfer should be effective on final payment, not on signature. Keep moral rights and portfolio rights where local law allows." },
      { name: "Termination and kill fee", body: "Mutual termination with notice, kill fee covering work done plus reasonable margin." },
      { name: "Indemnification", body: "Mutual, capped at fees paid. Carve out gross negligence and IP infringement as separate (lower) caps." },
      { name: "Governing law and jurisdiction", body: "Your home jurisdiction beats theirs. Arbitration in a third-country city is fine; theirs is not." },
    ],
    faq: [
      { q: "What payment terms should I push for as a freelancer?", a: "Net 14 with a 30-50% upfront deposit for projects under $10K. Milestones for larger projects. Anything beyond Net 30 is a financing favor you're not getting paid for." },
      { q: "Should I sign over all IP rights?", a: "If the deliverables are bespoke client work, yes — but tie the transfer to final payment, not signature. Reserve portfolio rights and any underlying tools you brought into the project." },
      { q: "How much should a kill fee be?", a: "Minimum: 100% of work completed to date plus 20-30% of the remaining contract value. Higher for short-notice termination." },
      { q: "Can a client force me to sign a non-compete?", a: "They can ask. Most non-competes against freelancers are unenforceable in the EU, increasingly so in the US. Narrow them or strike them." },
      { q: "What's the right indemnity cap for a $5K project?", a: "Cap total indemnity at fees paid ($5K). Carve out IP infringement at a higher cap (e.g., $25K) if the client insists. Refuse uncapped indemnity." },
    ],
    targetKeyword: "freelance contract review",
  },
  "employment-contract": {
    slug: "employment-contract",
    h1: "Check an employment contract online before you sign",
    title: "Check an Employment Contract Online",
    description:
      "Upload your job offer or employment contract and Green Flagged flags one-sided non-competes, vague bonus clauses, IP grabs, and probation traps in minutes.",
    lede:
      "Job offers come in clean PDFs and bury the real terms in the fine print. Green Flagged scans every clause against an employment-contract checklist so you know exactly what you're agreeing to before you accept.",
    noun: "this employment contract",
    redFlagsTitle: "8 red flags we look for in employment contracts",
    redFlags: [
      { title: "Non-compete broader than role and geography", body: "Enforceability varies by jurisdiction, but anything global or industry-wide is a major red flag." },
      { title: "Discretionary bonus with no objective criteria", body: "If \"bonus targets to be set\" never gets resolved, you'll never see the bonus." },
      { title: "IP assignment covering work done outside hours", body: "Standard IP clauses cover work-product; clauses covering side projects or pre-existing IP are aggressive." },
      { title: "Unilateral right to change terms", body: "Clauses letting the employer change duties, location, or hours without your consent are common and usually unenforceable but worth flagging." },
      { title: "Probation period >6 months", body: "Probation that exceeds local statutory limits silently waives protections you'd otherwise have." },
      { title: "Garden leave longer than notice", body: "Garden leave should not exceed your contractual notice unless you're being paid full salary throughout." },
      { title: "Vague termination causes", body: "\"Material breach\" without examples; \"unsatisfactory performance\" with no review process; \"loss of trust\" — these are all designed to lower the firing bar." },
      { title: "Arbitration with employer-paid arbitrator", body: "Mandatory arbitration where the employer selects and pays the arbitrator is an enforceability red flag." },
    ],
    clauses: [
      { name: "Role and duties", body: "Specific role, reporting line, primary work location. Avoid \"and other duties as assigned\" without scope limit." },
      { name: "Compensation and bonus", body: "Base, bonus structure with objective targets, equity grant with vesting schedule and acceleration triggers." },
      { name: "IP and inventions", body: "Limited to work product. Exclude pre-existing IP via schedule; exclude inventions developed on your own time with your own resources." },
      { name: "Non-compete and non-solicit", body: "Narrow scope, narrow geography, ≤12 months, with paid garden leave during the restricted period." },
      { name: "Termination and notice", body: "Notice should be mutual and reasonable for your level. Severance for senior roles is standard." },
      { name: "Governing law and dispute resolution", body: "Local court is usually fine for employees; mandatory arbitration with employer-paid arbitrator is not." },
    ],
    faq: [
      { q: "Are non-competes in employment contracts enforceable?", a: "It depends heavily on jurisdiction. They are largely unenforceable in California, increasingly limited in the EU and UK. Where enforceable, they must be narrow in scope, geography, and time." },
      { q: "What should a fair severance look like?", a: "1-2 weeks per year of service is a common floor for non-senior roles; 3-12 months base for senior roles. Acceleration of equity vesting on without-cause termination is standard at growth companies." },
      { q: "Does the employer own everything I create on the side?", a: "Standard IP clauses cover work done within scope of employment. Broad clauses covering all your time and IP are increasingly unenforceable; insist on a schedule of pre-existing and excluded IP." },
      { q: "Should I sign before I've negotiated?", a: "No. Once you sign, leverage drops to zero. Get every clarification in writing — especially bonus criteria, equity acceleration, and termination cause definitions — before signing." },
      { q: "Does Green Flagged understand German Arbeitsvertrag specifics?", a: "It flags structural issues (probation length, notice periods, non-competes) and provides German-law context where it's clearly relevant. For BAG-specific language, a German employment lawyer is still the right call." },
    ],
    targetKeyword: "employment contract checker",
  },
  "lease-agreement": {
    slug: "lease-agreement",
    h1: "Check a lease agreement online — AI rental contract review",
    title: "Check a Lease Agreement Online",
    description:
      "Upload your rental or lease agreement and Green Flagged checks for unfair penalty clauses, excessive deposits, rent-increase traps, and termination overreach.",
    lede:
      "Most lease agreements are landlord templates, and the unfair clauses are usually the unenforceable ones — but you'll only know which ones if you read them carefully. Green Flagged scans your lease against a checklist of common landlord-favorable patterns in minutes.",
    noun: "this lease agreement",
    redFlagsTitle: "8 red flags we look for in lease agreements",
    redFlags: [
      { title: "Deposit above local legal maximum", body: "Most jurisdictions cap deposits at 2-3 months. Anything higher is unenforceable but worth challenging upfront." },
      { title: "Rent-increase formula with no cap", body: "CPI-linked is fine; \"at landlord's discretion\" is not. Some jurisdictions cap annual increases." },
      { title: "Repair responsibility shifted entirely to tenant", body: "Structural repairs and major systems (heating, plumbing) are usually the landlord's responsibility — clauses shifting them to you are often unenforceable." },
      { title: "No-pet / no-overnight-guest absolutes", body: "Increasingly unenforceable; flag for negotiation rather than acceptance." },
      { title: "Excessive break-lease penalties", body: "Liquidated damages exceeding actual relet cost are often struck down in court." },
      { title: "Right to enter without notice", body: "Most jurisdictions require 24-48 hours notice except in emergencies." },
      { title: "Automatic renewal with short opt-out window", body: "Designed to be missed. Calendar the opt-out date the moment you sign." },
      { title: "Withholding deposit for vague 'cleaning' or 'wear-and-tear'", body: "Normal wear-and-tear is not a tenant cost. Itemized check-in/check-out inventory is your protection." },
    ],
    clauses: [
      { name: "Rent, deposit, and increases", body: "Monthly rent, deposit amount, escalation formula. Watch for hidden \"administrative\" or \"key handover\" fees." },
      { name: "Term and renewal", body: "Initial term, renewal terms, notice periods. Auto-renewal should be flagged and dated." },
      { name: "Repairs and maintenance", body: "Tenant: minor repairs, day-to-day upkeep. Landlord: structural, systems, appliances they supplied." },
      { name: "Use and quiet enjoyment", body: "Subletting, guests, business use. Should be reasonable, not absolute." },
      { name: "Termination and break-lease", body: "Notice required, conditions for early termination, penalty cap." },
      { name: "Inventory and condition", body: "Detailed check-in inventory with dated photos is your strongest protection at move-out." },
    ],
    faq: [
      { q: "How much can a landlord legally charge for deposit?", a: "In most EU jurisdictions, 2-3 months' rent is the cap. In the US, it varies by state — many cap at 1-2 months. Anything higher is usually unenforceable, but you'd have to litigate to recover it." },
      { q: "Can my landlord raise rent any time?", a: "No — most leases fix rent for the initial term. Increases mid-term need explicit contractual basis (e.g., CPI-linked). Some jurisdictions impose annual increase caps." },
      { q: "Who pays for repairs?", a: "Generally: landlord pays for structural and major-system repairs; tenant pays for minor day-to-day items and damage they caused. Lease language attempting to shift major repairs to you is often unenforceable." },
      { q: "Can the landlord withhold my deposit for normal wear-and-tear?", a: "No. Normal wear-and-tear (faded paint, minor carpet wear) is the landlord's cost of doing business. Damage beyond that — yes. Photographic inventory at move-in and move-out is decisive." },
      { q: "Does Green Flagged understand German Mietvertrag specifics?", a: "Yes — Mietkaution caps, Staffelmiete vs Indexmiete, Eigenbedarf grounds, and Kündigungsfristen are all flagged where relevant." },
    ],
    targetKeyword: "lease agreement review",
  },
  "saas-agreement": {
    slug: "saas-agreement",
    h1: "Check a SaaS agreement online — vendor contract review",
    title: "Check a SaaS Agreement Online",
    description:
      "Review SaaS vendor agreements and order forms for one-sided liability caps, data-ownership grabs, auto-renew traps, and unbounded fee increases.",
    lede:
      "SaaS MSAs are written by the vendor, for the vendor. The same five problems repeat across hundreds of templates. Green Flagged scans your order form and MSA against a SaaS-specific checklist so you can negotiate before signing.",
    noun: "this SaaS agreement",
    redFlagsTitle: "8 red flags we look for in SaaS agreements",
    redFlags: [
      { title: "Liability cap of 12 months of fees", body: "Industry standard; for high-stakes data, push for 2-3x annual fees or a separate IP/data-breach carve-out." },
      { title: "Auto-renew with 90-day cancellation window", body: "Combined with annual prepay, this can lock you in for another year if you blink. 30-day window is fairer." },
      { title: "Vendor owns derived data and usage metrics", body: "Usage data, telemetry, aggregated insights — vendor will often claim full rights. Negotiate a license for vendor use; you retain ownership." },
      { title: "Uncapped fee increases at renewal", body: "Annual increases capped at CPI + 3% is reasonable. \"At vendor's then-current rates\" is not." },
      { title: "Data return only in proprietary format", body: "Insist on data export in machine-readable, non-proprietary format (CSV, JSON) at termination." },
      { title: "Vendor's standard SLA with no remedies", body: "If the SLA has no credit/penalty for missed uptime, it's marketing copy, not a service level." },
      { title: "Limitation of liability excludes IP indemnity", body: "Carve out IP infringement indemnity from the liability cap — that's the one thing you actually need uncapped protection on." },
      { title: "Subcontractors named only in a side document", body: "Sub-processor lists buried elsewhere often change. Require notification of new sub-processors with a right to terminate." },
    ],
    clauses: [
      { name: "Subscription term and auto-renewal", body: "Initial term, renewal terms, notice period. 30-day cancellation window is fair; 60-90 is hostile." },
      { name: "Fees and increases", body: "Cap increases (CPI + N%, or fixed %). Prepaid vs in-arrears matters at termination." },
      { name: "Data, security, and privacy", body: "Data ownership stays with you. Vendor needs only a license to operate the service. DPA must be in place if processing personal data." },
      { name: "Service levels", body: "Uptime % with definitions, exclusions, and remedies (service credits, termination right at threshold). Without remedies, an SLA is decorative." },
      { name: "Liability and indemnification", body: "Mutual cap at 12 months fees with IP-indemnity carve-out. Reps and warranties section should not silently lower the cap." },
      { name: "Termination and data return", body: "Termination for cause, for convenience, for material breach. Data return in usable format within 30-60 days." },
    ],
    faq: [
      { q: "What's a fair SaaS liability cap?", a: "12 months of fees paid is the industry default. For mission-critical or sensitive-data services, push for 2-3x annual fees, or a separate higher cap for IP and data-breach claims." },
      { q: "How do I avoid being locked into auto-renewal?", a: "Negotiate a 30-day cancellation window (most vendors will agree); calendar the opt-out date when you sign. Move to monthly billing if the vendor allows, even at a small premium." },
      { q: "Does the vendor own my data?", a: "No — your data is yours. The vendor needs a license to operate the service, nothing more. Push back on \"derived data,\" \"aggregated insights,\" or any clause granting the vendor rights beyond service operation." },
      { q: "Should I sign without a DPA if we're EU?", a: "No. If the vendor processes personal data on your behalf, a written DPA (Data Processing Agreement) under GDPR Article 28 is required. The standard contractual clauses must be attached for non-EU transfers." },
      { q: "What's a real SLA vs a marketing SLA?", a: "A real SLA has: defined uptime measurement, defined exclusions, service credits scaled to severity, and a termination right if uptime drops below a floor for N consecutive months. Without remedies, it's just a number on a page." },
    ],
    targetKeyword: "SaaS agreement review",
  },
  "service-agreement": {
    slug: "service-agreement",
    h1: "Check a service agreement online — AI MSA review",
    title: "Check a Service Agreement Online",
    description:
      "Upload your services agreement, MSA, or SOW and Green Flagged scans for payment timing, scope creep traps, IP transfer overreach, and termination imbalance.",
    lede:
      "Master services agreements are usually drafted by the buyer's procurement team and stack the deck against the provider. Green Flagged scans every clause against an MSA checklist and tells you in plain English where the leverage actually sits.",
    noun: "this service agreement",
    redFlagsTitle: "8 red flags we look for in service agreements",
    redFlags: [
      { title: "Most-favored-customer clause", body: "Commits you to never give a better price to anyone else. Hard to comply with, easy to breach." },
      { title: "Time-and-materials with no cap", body: "Fine for the provider, terrible for the buyer. Always include a not-to-exceed (NTE) cap with re-baselining triggers." },
      { title: "Acceptance criteria that are subjective", body: "If acceptance depends on \"buyer's reasonable satisfaction\" without objective criteria, payment becomes optional." },
      { title: "Unilateral right to extend SOW", body: "Lets the buyer pull on extra work at the SOW rate, indefinitely. Cap with a re-quote requirement." },
      { title: "Service credits as exclusive remedy", body: "Common in vendor templates; favors the provider. Add termination right at credit threshold." },
      { title: "Non-solicit of provider's people", body: "Reasonable when narrow (parties' employees, 12 months); unreasonable when applied to anyone the buyer interacted with." },
      { title: "Audit rights with no scope limit", body: "Mutual audit rights are fine; one-sided, broadly worded audit rights are a compliance hammer." },
      { title: "Vague change-order procedure", body: "If changes can be made by email without amendment, scope creep is the default." },
    ],
    clauses: [
      { name: "Statement of Work hierarchy", body: "Defines which document controls when SOW and MSA conflict. Usually SOW controls for project-specific terms." },
      { name: "Fees, expenses, and payment", body: "Net 30 is typical. Late-payment interest. Invoicing cadence and approval process." },
      { name: "Acceptance and warranties", body: "Objective acceptance criteria, deemed-acceptance period, warranty duration with explicit remedies." },
      { name: "Change orders", body: "Written, signed, with cost and schedule impact. No work proceeds until signed." },
      { name: "IP ownership", body: "Work product transfer on full payment; provider retains pre-existing IP and tools." },
      { name: "Limitation of liability", body: "Mutual cap (typically 12 months fees), carve-outs for IP indemnity, confidentiality breach, gross negligence." },
    ],
    faq: [
      { q: "When is an MSA worth signing vs project-by-project?", a: "When you expect more than 2-3 projects with the same counterparty. The MSA front-loads negotiation so each SOW is short and easy." },
      { q: "Should the MSA or the SOW control?", a: "Generally: SOW controls for project-specific terms (scope, fees, timeline); MSA controls for legal terms (IP, liability, confidentiality). State the hierarchy explicitly." },
      { q: "What's a reasonable change-order process?", a: "Written, signed, with stated cost and schedule impact. Work doesn't start until the change order is signed. Email approvals create disputes." },
      { q: "How do I avoid scope creep?", a: "Specific deliverables, specific acceptance criteria, specific revision rounds. \"As needed\" and \"ongoing support\" are the two phrases that create endless work for the same fee." },
      { q: "Should I worry about a most-favored-customer clause?", a: "Yes. They sound reasonable but in practice are unmonitorable and impose real risk. Negotiate them out, or limit them to a defined product/territory window." },
    ],
    targetKeyword: "service agreement review",
  },
  "contractor-agreement": {
    slug: "contractor-agreement",
    h1: "Check a contractor agreement online before you sign",
    title: "Check a Contractor Agreement Online",
    description:
      "Review independent contractor agreements for misclassification risk, IP transfer overreach, hidden non-competes, and one-sided termination clauses.",
    lede:
      "Independent contractor agreements straddle a line — too much employer-like control and you're an employee in disguise. Green Flagged checks every clause for the patterns that create classification risk, IP traps, and unfair termination.",
    noun: "this contractor agreement",
    redFlagsTitle: "8 red flags we look for in contractor agreements",
    redFlags: [
      { title: "Hours, location, and tools controlled by client", body: "Indicators of employment misclassification — increases your risk and the client's." },
      { title: "Exclusive engagement", body: "Independent contractors should be free to take other clients. Exclusivity rarely survives a classification audit." },
      { title: "Non-compete after termination", body: "Hard to enforce against contractors and a misclassification flag." },
      { title: "All-IP-assigned including pre-existing work", body: "Carve out pre-existing IP via a schedule and retain a license for ongoing reuse." },
      { title: "Indemnity uncapped or excluding the contractor's cap", body: "Contractor's indemnity should be capped at fees received." },
      { title: "Termination for any reason with no notice", body: "Without a notice period, you can be cut off mid-project with no pay for completed-but-uninvoiced work." },
      { title: "Expense reimbursement with vague approval rules", body: "Expenses should be pre-approved or covered by a fixed allowance." },
      { title: "Background check / NDA obligations binding the contractor's contractors", body: "Reasonable for sub-contractors; unreasonable as a blanket clause." },
    ],
    clauses: [
      { name: "Status as independent contractor", body: "Explicit non-employee status, no benefits, no withholding. Reality has to match the words." },
      { name: "Services and deliverables", body: "Specific outputs, specific timeline, specific acceptance. Hourly with NTE cap, or fixed-fee with milestones." },
      { name: "Payment", body: "Net 14 ideal, Net 30 acceptable. Invoicing cadence. Late-payment interest." },
      { name: "IP ownership", body: "Work product to client on final payment; pre-existing IP retained by contractor with a non-exclusive license to client." },
      { name: "Confidentiality", body: "Mutual obligations, defined term (2-5 years), standard carve-outs." },
      { name: "Termination", body: "Notice period (usually 14-30 days), payment for work-to-date, return of materials." },
    ],
    faq: [
      { q: "What makes a contractor agreement risky from a classification standpoint?", a: "Client control over hours, location, tools, and methods; exclusivity; long-term engagement with no other clients; integration into the client's organizational structure. The IRS, HMRC, and EU member states each have their own multi-factor tests." },
      { q: "Should I assign all IP to the client?", a: "For work-product IP created during the engagement, yes — but exclude pre-existing IP and reusable tools via a schedule. Retain a license for the contractor's own ongoing use where possible." },
      { q: "Can the client impose a non-compete after the engagement ends?", a: "They can try, but post-engagement non-competes against independent contractors are largely unenforceable and increase misclassification risk for the client. Negotiate to remove or narrow significantly." },
      { q: "What payment terms should an independent contractor accept?", a: "Net 14 with milestones. Net 30 is the upper limit. Anything beyond Net 30 is the client treating you as a financing vehicle." },
      { q: "Does the agreement need to specify hours?", a: "It should specify deliverables and milestones, not hours. Hour specifications signal employment-like control and increase classification risk." },
    ],
    targetKeyword: "contractor agreement review",
  },
  "influencer-contract": {
    slug: "influencer-contract",
    h1: "Check an influencer / brand-deal contract online",
    title: "Check an Influencer Contract Online",
    description:
      "Review brand-deal and influencer agreements for exclusivity overreach, content-ownership grabs, vague deliverable specs, and unreasonable usage rights.",
    lede:
      "Brand deals are templated for the brand and renegotiated by every creator. Green Flagged scans every clause against the patterns that actually matter — exclusivity, usage rights, content ownership, and payment timing.",
    noun: "this influencer contract",
    redFlagsTitle: "8 red flags we look for in influencer contracts",
    redFlags: [
      { title: "Category exclusivity longer than the campaign", body: "Exclusivity should match the campaign window, not extend afterward without separate pay." },
      { title: "Perpetual content usage rights", body: "Brands often request perpetual rights to your content; negotiate 12 months with paid renewal." },
      { title: "Brand owns content outright", body: "License, not assignment, is the norm. You created it; you keep the IP, brand gets the rights they paid for." },
      { title: "Approval rights with no SLA", body: "Without a maximum approval turnaround (e.g., 5 business days), the brand can hold up payment indefinitely." },
      { title: "Vague engagement guarantees", body: "Don't guarantee specific engagement metrics. Your job is content; engagement is platform-dependent." },
      { title: "Whitelisting / paid amplification without separate fee", body: "If the brand wants to run ads from your handle, that's a separate paid right." },
      { title: "Morality clause too broad", body: "Specific, listed conduct (illegal, hate speech). Not \"anything the brand finds objectionable.\"" },
      { title: "Payment Net 60+", body: "Standard for brands, brutal for creators. Push to Net 30 with a partial deposit." },
    ],
    clauses: [
      { name: "Deliverables and content specs", body: "Specific number of posts/stories/videos, platform, format, hashtags, mentions. Spec creep is the most common dispute." },
      { name: "Exclusivity", body: "Defined category, defined window matching the campaign. Anything broader needs separate compensation." },
      { name: "Content usage and licensing", body: "License to brand for specified term, specified channels, specified geographies. Whitelisting separate. Renewal at the same fee or a fixed multiple." },
      { name: "Payment", body: "Deposit on signature, balance on delivery and brand approval (with approval SLA). Net 30 maximum." },
      { name: "Approvals", body: "Brand review window (5-7 business days), one round of revisions, deemed-approved if no response." },
      { name: "Termination and force majeure", body: "Defined cause, kill fee for early termination, force majeure for platform changes or removal." },
    ],
    faq: [
      { q: "Should I sign over content ownership to the brand?", a: "No. License the rights the brand actually needs (specific channels, specific term) and retain ownership. Brand pays for usage rights, not for the IP itself." },
      { q: "How long should exclusivity last?", a: "Exclusivity should match the campaign window — typically 30-90 days. Extended exclusivity (6-12 months) commands a significant premium, often 2-3x the campaign fee." },
      { q: "What's a fair approval turnaround?", a: "5-7 business days, with one round of revisions, and deemed-approved if no response within the window. This prevents the brand from indefinitely holding your content (and payment) hostage." },
      { q: "Should I guarantee engagement numbers?", a: "No. Guarantee deliverables (content type, posting time, hashtags, mentions). Engagement depends on platform algorithms and is not something you can responsibly guarantee." },
      { q: "What's whitelisting and should I allow it?", a: "Whitelisting is the brand running paid ads from your handle. It's a separate right with separate value — typically priced as a percentage of the brand's ad spend. Don't include it in the base fee." },
    ],
    targetKeyword: "influencer contract review",
  },
};

export const CHECK_TYPES = t;
export const CHECK_TYPE_SLUGS = Object.keys(t) as (keyof typeof t)[];
