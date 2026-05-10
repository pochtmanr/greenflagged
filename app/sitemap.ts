import type { MetadataRoute } from "next";

const ROUTES = [
  "/",
  "/pricing",
  "/how-it-works",
  "/use-cases",
  "/about",
  "/contact",
  "/blog",
  "/terms",
  "/privacy",
  "/imprint",
  "/cookies",
  "/disclaimer",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://greenflagged.app";
  const lastModified = new Date();
  return ROUTES.map((path) => ({
    url: `${base}${path}`,
    lastModified,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
