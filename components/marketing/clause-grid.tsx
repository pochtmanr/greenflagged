import { SectionHeading } from "@/components/marketing/section-heading";
import { ClauseCell } from "@/components/marketing/clause-cell";
import type { LandingArtKey } from "@/lib/landing/images";

const CATEGORIES: Array<{
  id: string;
  n: string;
  title: string;
  ex: string;
  art: LandingArtKey;
}> = [
  {
    id: "payment",
    n: "01",
    title: "Payment",
    ex:
      "Net-90 with no late fee, paid only on client's acceptance — money sits with them for months.",
    art: "path",
  },
  {
    id: "scope",
    n: "02",
    title: "Scope",
    ex: "\"Reasonable revisions\" with no cap. Unbounded scope = unbounded unpaid work.",
    art: "tower",
  },
  {
    id: "ip",
    n: "03",
    title: "IP transfer",
    ex:
      "All your prior work and tools become the client's property the moment you deliver.",
    art: "figureRed",
  },
  {
    id: "restrict",
    n: "04",
    title: "Restrictions",
    ex:
      "12-month non-compete covering an entire industry — likely unenforceable but a leverage tool.",
    art: "deerForest",
  },
  {
    id: "liability",
    n: "05",
    title: "Liability",
    ex:
      "Uncapped indemnification for any third-party claim, including ones outside your control.",
    art: "reflection",
  },
  {
    id: "termination",
    n: "06",
    title: "Termination",
    ex:
      "Client can terminate \"for convenience\" with 7 days' notice; you owe a 30-day notice penalty.",
    art: "gateway",
  },
  {
    id: "dispute",
    n: "07",
    title: "Dispute resolution",
    ex:
      "Mandatory arbitration in a jurisdiction 4,000 miles away, with their choice of arbitrator.",
    art: "viewpoint",
  },
  {
    id: "amendments",
    n: "08",
    title: "Amendments",
    ex:
      "\"Schedule may be amended in writing by Client\" — they can rewrite the deal unilaterally.",
    art: "deerClearing",
  },
];

export function ClauseGrid() {
  return (
    <section id="categories" className="section section--sunken">
      <div className="container">
        <SectionHeading
          eyebrow="// 03  What we scan"
          lead="Eight categories. Four severity levels."
          sub="Each clause is scored against the same eight risk dimensions a senior contracts lawyer would check."
        />
        <div className="clause-grid">
          {CATEGORIES.map((c, i) => (
            <ClauseCell
              key={c.id}
              n={c.n}
              id={c.id}
              title={c.title}
              example={c.ex}
              art={c.art}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
