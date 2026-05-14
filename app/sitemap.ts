import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";
import { CHECK_TYPES } from "@/content/check-types";
import { getSupabaseServer } from "@/lib/supabase/server";

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }[] = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/pricing", priority: 0.9, changeFrequency: "monthly" },
  { path: "/how-it-works", priority: 0.9, changeFrequency: "monthly" },
  { path: "/use-cases", priority: 0.8, changeFrequency: "monthly" },
  { path: "/check", priority: 0.9, changeFrequency: "weekly" },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" },
  { path: "/press", priority: 0.6, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.8, changeFrequency: "weekly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/imprint", priority: 0.3, changeFrequency: "yearly" },
  { path: "/cookies", priority: 0.3, changeFrequency: "yearly" },
  { path: "/disclaimer", priority: 0.3, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const checkEntries: MetadataRoute.Sitemap = Object.keys(CHECK_TYPES).map(
    (slug) => ({
      url: `${SITE_URL}/check/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })
  );

  let blogEntries: MetadataRoute.Sitemap = [];
  try {
    const supabase = await getSupabaseServer();
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, updated_at, published_at")
      .lte("published_at", now.toISOString());

    blogEntries = (posts ?? []).map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  } catch {
    // Supabase unreachable at build time — fall through with static + check entries.
  }

  return [...staticEntries, ...checkEntries, ...blogEntries];
}
