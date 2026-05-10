export type Currency = "eur";

export type Tier = {
  id: "payg" | "freelancer" | "pro";
  name: string;
  blurb: string;
  monthly: { amount: number; period: string };
  yearly: { amount: number; period: string };
  features: string[];
  cta: string;
  ctaHref: string;
  highlighted?: boolean;
};

export const TIERS: Tier[] = [
  {
    id: "payg",
    name: "Pay per contract",
    blurb: "Test it first. Pay once, get one full verdict.",
    monthly: { amount: 9, period: "one-off" },
    yearly: { amount: 9, period: "one-off" },
    features: [
      "1 full contract analysis",
      "Plain-language explanations",
      "Suggested redline edits",
      "PDF export of the report",
      "Auto-delete after 30 days",
    ],
    cta: "Buy one scan",
    ctaHref: "/#hero-drop",
  },
  {
    id: "freelancer",
    name: "Freelancer",
    blurb: "For active freelancers signing contracts regularly.",
    monthly: { amount: 15, period: "/ month" },
    yearly: { amount: 150, period: "/ year" },
    features: [
      "Unlimited contract analyses",
      "History of past reviews",
      "Side-by-side contract comparison",
      "Custom retention (30 / 60 / 90 days)",
      "Email support",
    ],
    cta: "Start with Freelancer",
    ctaHref: "/#hero-drop",
    highlighted: true,
  },
  {
    id: "pro",
    name: "Pro / Agency",
    blurb: "Teams reviewing contracts at scale.",
    monthly: { amount: 39, period: "/ month" },
    yearly: { amount: 390, period: "/ year" },
    features: [
      "Everything in Freelancer",
      "3 team seats included",
      "Custom risk profiles per user",
      "Priority AI processing",
      "Contract templates library",
      "Limited API access",
    ],
    cta: "Start with Pro",
    ctaHref: "/#hero-drop",
  },
];
