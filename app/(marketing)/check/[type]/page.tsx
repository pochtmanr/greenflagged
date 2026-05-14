import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CHECK_TYPES, type CheckType } from "@/content/check-types";
import {
  BreadcrumbListSchema,
  FAQPageSchema,
  SoftwareApplicationSchema,
} from "@/lib/seo/json-ld";
import { SITE_URL } from "@/lib/config";

type Params = { type: string };

export function generateStaticParams(): Params[] {
  return Object.keys(CHECK_TYPES).map((type) => ({ type }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { type } = await params;
  const data: CheckType | undefined = CHECK_TYPES[type];
  if (!data) return {};

  const url = `/check/${data.slug}`;
  return {
    title: data.title,
    description: data.description,
    alternates: { canonical: url },
    openGraph: {
      url,
      title: data.title,
      description: data.description,
    },
    twitter: {
      title: data.title,
      description: data.description,
    },
  };
}

export default async function CheckTypePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { type } = await params;
  const data = CHECK_TYPES[type];
  if (!data) notFound();

  return (
    <>
      <BreadcrumbListSchema
        items={[
          { name: "Home", url: "/" },
          { name: "Check a contract", url: "/check" },
          { name: data.h1, url: `/check/${data.slug}` },
        ]}
      />
      <FAQPageSchema items={data.faq} />
      <SoftwareApplicationSchema
        name={`Green Flagged — ${data.title}`}
        description={data.description}
        url={`${SITE_URL}/check/${data.slug}`}
      />

      <section className="section" style={{ paddingTop: 144 }}>
        <div className="container">
          <nav
            className="gf-mono-sm"
            style={{ color: "var(--fg-3)", marginBottom: 24 }}
            aria-label="Breadcrumb"
          >
            <Link href="/" style={{ color: "inherit" }}>Home</Link>
            {" / "}
            <Link href="/check" style={{ color: "inherit" }}>Check a contract</Link>
            {" / "}
            <span>{data.targetKeyword}</span>
          </nav>

          <div style={{ maxWidth: 820 }}>
            <span className="gf-label">// {data.slug.replace(/-/g, " ").toUpperCase()}</span>
            <h1 className="gf-h1" style={{ marginTop: 14 }}>
              {data.h1}
            </h1>
            <p className="gf-body" style={{ marginTop: 24, fontSize: 18 }}>
              {data.lede}
            </p>
            <div style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/scan" className="gf-btn">
                Scan {data.noun} now <span className="arrow">→</span>
              </Link>
              <Link href="/sign-up" className="gf-btn gf-btn-ghost">
                Start free
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--sunken">
        <div className="container">
          <span className="gf-label">// RED FLAGS</span>
          <h2 className="gf-h2" style={{ marginTop: 14, maxWidth: 720 }}>
            {data.redFlagsTitle}
          </h2>
          <div
            className="blog__grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 16,
              marginTop: 40,
            }}
          >
            {data.redFlags.map((rf, i) => (
              <div key={rf.title} className="gf-card">
                <span className="gf-mono-sm" style={{ color: "var(--green-500)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="gf-h4" style={{ marginTop: 12 }}>
                  {rf.title}
                </h3>
                <p className="gf-body-sm" style={{ marginTop: 8, color: "var(--fg-2)" }}>
                  {rf.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <span className="gf-label">// CLAUSE GUIDE</span>
          <h2 className="gf-h2" style={{ marginTop: 14, maxWidth: 720 }}>
            What to read in {data.noun}
          </h2>
          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 24 }}>
            {data.clauses.map((c) => (
              <div key={c.name} className="gf-card">
                <h3 className="gf-h4">{c.name}</h3>
                <p className="gf-body-sm" style={{ marginTop: 8, color: "var(--fg-2)" }}>
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--sunken">
        <div className="container">
          <span className="gf-label">// QUESTIONS</span>
          <h2 className="gf-h2" style={{ marginTop: 14, maxWidth: 720 }}>
            Frequently asked about {data.noun.replace(/^this /, "")}
          </h2>
          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 16 }}>
            {data.faq.map((it, i) => (
              <details key={i} className="gf-card" style={{ cursor: "pointer" }}>
                <summary
                  style={{
                    listStyle: "none",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 16,
                    fontWeight: 600,
                  }}
                >
                  <span>{it.q}</span>
                  <span aria-hidden style={{ color: "var(--green-500)" }}>+</span>
                </summary>
                <p
                  className="gf-body-sm"
                  style={{ marginTop: 12, color: "var(--fg-2)" }}
                >
                  {it.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="gf-card" style={{ textAlign: "center", padding: "48px 24px" }}>
            <h2 className="gf-h2" style={{ maxWidth: 640, margin: "0 auto" }}>
              Ready to check {data.noun}?
            </h2>
            <p
              className="gf-body"
              style={{ marginTop: 16, maxWidth: 540, margin: "16px auto 0", color: "var(--fg-2)" }}
            >
              Drop a PDF, DOCX, or paste plain text. Free first scan. No account required.
            </p>
            <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/scan" className="gf-btn">
                Scan now <span className="arrow">→</span>
              </Link>
              <Link href="/pricing" className="gf-btn gf-btn-ghost">
                See pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
