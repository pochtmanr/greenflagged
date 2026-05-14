// Canonical industry list. Slugs are stable; labels can change.
// Persisted as text[] on profiles.industries. Used by the onboarding
// wizard and settings to tailor templates and redlines.

export type Industry = { slug: string; label: string };

export const INDUSTRIES: Industry[] = [
  { slug: "freelance", label: "Freelance services" },
  { slug: "software", label: "Software / SaaS" },
  { slug: "design", label: "Design / Creative" },
  { slug: "marketing", label: "Marketing / Advertising" },
  { slug: "consulting", label: "Consulting / Advisory" },
  { slug: "ecommerce", label: "E-commerce / Retail" },
  { slug: "realestate", label: "Real estate" },
  { slug: "legal", label: "Legal services" },
  { slug: "healthcare", label: "Healthcare / Wellness" },
  { slug: "finance", label: "Finance / Fintech" },
  { slug: "education", label: "Education / Training" },
  { slug: "media", label: "Media / Content" },
  { slug: "nonprofit", label: "Non-profit / NGO" },
  { slug: "other", label: "Other" },
];

export const INDUSTRY_SLUGS = new Set(INDUSTRIES.map((i) => i.slug));
