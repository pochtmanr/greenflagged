import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Plain-English breakdowns of the clauses that trip up freelancers, founders, and creators.",
};

const UPCOMING = [
  "10 red flags in freelance contracts (and the language that fixes them)",
  "How to spot an unfair NDA before you sign",
  "SAFEs explained: where founders give up more than they realize",
  "Brand deal exclusivity: what's negotiable and what isn't",
  "The German Werkvertrag vs Dienstvertrag — what changes for freelancers",
];

export default function BlogPage() {
  return (
    <section className="section" style={{ paddingTop: 144 }}>
      <div className="container">
        <div style={{ maxWidth: 760 }}>
          <span className="gf-label">// BLOG</span>
          <h1 className="gf-h1" style={{ marginTop: 14 }}>
            Coming
            <br />
            <span style={{ color: "var(--green-500)" }}>soon.</span>
          </h1>
          <p className="gf-body" style={{ marginTop: 24, fontSize: 17 }}>
            We&apos;re writing the kind of contract guides we wish existed when
            we were signing our first ones. Short, specific, in plain English.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            marginTop: 64,
          }}
          className="blog__grid"
        >
          {UPCOMING.map((title) => (
            <div key={title} className="gf-card">
              <span className="gf-label">COMING SOON</span>
              <h3 className="gf-h4" style={{ marginTop: 16 }}>
                {title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
