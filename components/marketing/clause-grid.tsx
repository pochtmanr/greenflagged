import { SectionHeading } from "@/components/marketing/section-heading";

const CATEGORIES = [
  {
    id: "payment",
    n: "01",
    title: "Payment",
    ex:
      "Net-90 with no late fee, paid only on client's acceptance — money sits with them for months.",
  },
  {
    id: "scope",
    n: "02",
    title: "Scope",
    ex: "\"Reasonable revisions\" with no cap. Unbounded scope = unbounded unpaid work.",
  },
  {
    id: "ip",
    n: "03",
    title: "IP transfer",
    ex:
      "All your prior work and tools become the client's property the moment you deliver.",
  },
  {
    id: "restrict",
    n: "04",
    title: "Restrictions",
    ex:
      "12-month non-compete covering an entire industry — likely unenforceable but a leverage tool.",
  },
  {
    id: "liability",
    n: "05",
    title: "Liability",
    ex:
      "Uncapped indemnification for any third-party claim, including ones outside your control.",
  },
  {
    id: "termination",
    n: "06",
    title: "Termination",
    ex:
      "Client can terminate \"for convenience\" with 7 days' notice; you owe a 30-day notice penalty.",
  },
  {
    id: "dispute",
    n: "07",
    title: "Dispute resolution",
    ex:
      "Mandatory arbitration in a jurisdiction 4,000 miles away, with their choice of arbitrator.",
  },
  {
    id: "amendments",
    n: "08",
    title: "Amendments",
    ex:
      "\"Schedule may be amended in writing by Client\" — they can rewrite the deal unilaterally.",
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
          {CATEGORIES.map((c) => (
            <div key={c.id} className="gf-card clause-cell">
              <span className="gf-label clause-cell__n">
                {c.n} / {c.id.toUpperCase()}
              </span>
              <h4 className="gf-h4 clause-cell__title">{c.title}</h4>
              <p className="gf-body-sm">{c.ex}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
