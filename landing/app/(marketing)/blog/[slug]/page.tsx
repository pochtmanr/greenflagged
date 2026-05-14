import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { getSupabaseServer } from "@/lib/supabase/server";
import { BlogPostingSchema, BreadcrumbListSchema } from "@/lib/seo/json-ld";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  try {
    const supabase = await getSupabaseServer();
    const { data } = await supabase
      .from("blog_posts")
      .select("slug")
      .lte("published_at", new Date().toISOString());
    return (data ?? []).map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

async function fetchPost(slug: string) {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      "slug, title, description, body_md, cover_image_url, author_name, tags, reading_minutes, published_at, updated_at"
    )
    .eq("slug", slug)
    .lte("published_at", new Date().toISOString())
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) return {};

  const url = `/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      url,
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at ?? undefined,
      authors: post.author_name ? [post.author_name] : undefined,
      tags: post.tags ?? undefined,
      images: post.cover_image_url ? [post.cover_image_url] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: post.cover_image_url ? [post.cover_image_url] : undefined,
    },
  };
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) notFound();

  return (
    <>
      <BreadcrumbListSchema
        items={[
          { name: "Home", url: "/" },
          { name: "Blog", url: "/blog" },
          { name: post.title, url: `/blog/${post.slug}` },
        ]}
      />
      <BlogPostingSchema post={post} />

      <article className="section" style={{ paddingTop: 144 }}>
        <div className="container">
          <div style={{ maxWidth: 760, marginInline: "auto" }}>
            <nav
              className="gf-mono-sm"
              style={{ color: "var(--fg-3)" }}
              aria-label="Breadcrumb"
            >
              <Link href="/" style={{ color: "inherit" }}>Home</Link>
              {" / "}
              <Link href="/blog" style={{ color: "inherit" }}>Blog</Link>
            </nav>

            <h1 className="gf-h1" style={{ marginTop: 24 }}>
              {post.title}
            </h1>

            <div
              style={{
                marginTop: 16,
                display: "flex",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
                color: "var(--fg-3)",
              }}
              className="gf-mono-sm"
            >
              <span>{post.author_name ?? "Green Flagged"}</span>
              <span>•</span>
              <time dateTime={post.published_at ?? undefined}>
                {formatDate(post.published_at)}
              </time>
              {post.reading_minutes ? (
                <>
                  <span>•</span>
                  <span>{post.reading_minutes} min read</span>
                </>
              ) : null}
            </div>

            {post.cover_image_url ? (
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "16 / 9",
                  marginTop: 48,
                  background: "var(--paper-200, #e8e6e0)",
                  overflow: "hidden",
                }}
              >
                <Image
                  src={post.cover_image_url}
                  alt={post.title}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 760px"
                  style={{ objectFit: "cover" }}
                />
              </div>
            ) : null}

            <div className="legal-body" style={{ marginTop: 48, lineHeight: 1.7 }}>
              <ReactMarkdown>{post.body_md}</ReactMarkdown>
            </div>

            {post.tags && post.tags.length > 0 ? (
              <div style={{ marginTop: 48, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {post.tags.map((t) => (
                  <span key={t} className="gf-tag">{t}</span>
                ))}
              </div>
            ) : null}

            <div
              className="gf-card"
              style={{ marginTop: 64, textAlign: "center", padding: 32 }}
            >
              <h2 className="gf-h3">Check your own contract</h2>
              <p
                className="gf-body-sm"
                style={{ marginTop: 12, color: "var(--fg-2)", maxWidth: 480, margin: "12px auto 0" }}
              >
                Drop a PDF or DOCX. Green Flagged runs the full clause checklist
                in under two minutes. Free, no account needed.
              </p>
              <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/scan" className="gf-btn">
                  Scan a contract <span className="arrow">→</span>
                </Link>
                <Link href="/check" className="gf-btn gf-btn-ghost">
                  Browse by contract type
                </Link>
              </div>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
