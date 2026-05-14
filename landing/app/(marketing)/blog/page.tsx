import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getSupabaseServer } from "@/lib/supabase/server";
import { BreadcrumbListSchema } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: "Blog — plain-English contract guides",
  description:
    "Plain-English breakdowns of the clauses that trip up freelancers, founders, and creators. Practical, specific, no legalese.",
  alternates: { canonical: "/blog" },
  openGraph: {
    url: "/blog",
    title: "Green Flagged — Blog",
    description:
      "Plain-English contract guides. The clauses that trip up freelancers, founders, and creators.",
  },
};

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function BlogPage() {
  const supabase = await getSupabaseServer();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, title, description, cover_image_url, published_at, reading_minutes, tags")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });

  const list = posts ?? [];

  return (
    <>
      <BreadcrumbListSchema
        items={[
          { name: "Home", url: "/" },
          { name: "Blog", url: "/blog" },
        ]}
      />

      <section className="section" style={{ paddingTop: 144 }}>
        <div className="container">
          <div style={{ maxWidth: 760 }}>
            <span className="gf-label">// BLOG</span>
            <h1 className="gf-h1" style={{ marginTop: 14 }}>
              Plain-English
              <br />
              <span style={{ color: "var(--green-500)" }}>contract guides.</span>
            </h1>
            <p className="gf-body" style={{ marginTop: 24, fontSize: 17 }}>
              The clauses that trip up freelancers, founders, and creators —
              broken down in the kind of guides we wish existed when we signed
              our first contracts.
            </p>
          </div>

          {list.length === 0 ? (
            <p className="gf-body-sm" style={{ marginTop: 48, color: "var(--fg-2)" }}>
              No posts published yet. Check back soon.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 24,
                marginTop: 64,
              }}
              className="blog__grid"
            >
              {list.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="gf-card"
                  style={{ display: "block", textDecoration: "none", padding: 0, overflow: "hidden" }}
                >
                  {p.cover_image_url ? (
                    <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", background: "var(--paper-200, #e8e6e0)" }}>
                      <Image
                        src={p.cover_image_url}
                        alt={p.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  ) : null}
                  <div style={{ padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span className="gf-mono-sm" style={{ color: "var(--fg-3)" }}>
                        {formatDate(p.published_at)}
                      </span>
                      {p.reading_minutes ? (
                        <span className="gf-mono-sm" style={{ color: "var(--fg-3)" }}>
                          {p.reading_minutes} min read
                        </span>
                      ) : null}
                    </div>
                    <h3 className="gf-h4" style={{ marginTop: 12 }}>
                      {p.title}
                    </h3>
                    <p className="gf-body-sm" style={{ marginTop: 12, color: "var(--fg-2)" }}>
                      {p.description}
                    </p>
                    <p className="gf-mono-sm" style={{ marginTop: 16, color: "var(--green-500)" }}>
                      Read post →
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
