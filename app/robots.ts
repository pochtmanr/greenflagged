import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

const PRIVATE = [
  "/api/",
  "/dashboard",
  "/onboarding",
  "/scan",
  "/contracts",
  "/settings",
  "/checkout",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/auth",
];

const AI_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      ...AI_BOTS.map((ua) => ({ userAgent: ua, allow: "/", disallow: PRIVATE })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
