import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_EMAIL,
  COMPANY_NAME,
  COMPANY_COUNTRY,
  FOUNDING_DATE,
  SOCIAL_LINKS,
} from "@/lib/config";
import type { FaqItem } from "@/content/faq";

function jsonLd(payload: unknown) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}

export function OrganizationSchema() {
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    legalName: COMPANY_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    foundingDate: FOUNDING_DATE,
    email: SITE_EMAIL,
    address: { "@type": "PostalAddress", addressCountry: COMPANY_COUNTRY },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: SITE_EMAIL,
      availableLanguage: ["en"],
    },
    sameAs: SOCIAL_LINKS,
  });
}

export function WebSiteSchema() {
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: "en",
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  });
}

type SoftwareSchemaProps = {
  name?: string;
  description?: string;
  url?: string;
  ratingValue?: number;
  ratingCount?: number;
};

export function SoftwareApplicationSchema(props: SoftwareSchemaProps = {}) {
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: props.name ?? SITE_NAME,
    description: props.description ?? SITE_DESCRIPTION,
    url: props.url ?? SITE_URL,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Contract Review",
    operatingSystem: "Web",
    offers: [
      {
        "@type": "Offer",
        name: "Free",
        price: "0",
        priceCurrency: "USD",
        description: "One contract per month, free.",
      },
      {
        "@type": "Offer",
        name: "Pay as you go",
        price: "3",
        priceCurrency: "USD",
        description: "$3 per contract, no commitment.",
      },
      {
        "@type": "Offer",
        name: "Standard",
        price: "25",
        priceCurrency: "USD",
        description: "10 contracts per month, $3 per extra contract.",
      },
    ],
    ...(props.ratingValue && props.ratingCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: props.ratingValue,
            ratingCount: props.ratingCount,
          },
        }
      : {}),
  });
}

export function FAQPageSchema({ items }: { items: readonly FaqItem[] }) {
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  });
}

export type BreadcrumbItem = { name: string; url: string };

export function BreadcrumbListSchema({ items }: { items: BreadcrumbItem[] }) {
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url.startsWith("http") ? it.url : `${SITE_URL}${it.url}`,
    })),
  });
}

type BlogPostingInput = {
  slug: string;
  title: string;
  description: string;
  author_name: string | null;
  published_at: string | null;
  updated_at: string | null;
  cover_image_url: string | null;
};

export function BlogPostingSchema({ post }: { post: BlogPostingInput }) {
  const image = post.cover_image_url
    ? post.cover_image_url.startsWith("http")
      ? post.cover_image_url
      : `${SITE_URL}${post.cover_image_url}`
    : `${SITE_URL}/og.png`;

  return jsonLd({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image,
    datePublished: post.published_at ?? undefined,
    dateModified: post.updated_at ?? post.published_at ?? undefined,
    author: { "@type": "Organization", name: post.author_name ?? SITE_NAME },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${post.slug}`,
    },
  });
}
