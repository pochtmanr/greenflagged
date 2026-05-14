import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/config";
import { CHECK_TYPES } from "@/content/check-types";

export const dynamic = "force-static";

export function GET() {
  const checkLinks = Object.values(CHECK_TYPES)
    .map((t) => `- [${t.h1}](${SITE_URL}/check/${t.slug}): ${t.description}`)
    .join("\n");

  const body = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

${SITE_NAME} reviews contracts clause-by-clause. It surfaces severity-ranked red flags and plain-English explanations of what each clause means and why it matters. The product is free for one contract per month, $3 per contract pay-as-you-go, or $25/month for 10 contracts on the Standard plan.

## Core pages

- [Home](${SITE_URL}/): What ${SITE_NAME} is, how it works, sample verdict, pricing, FAQ.
- [How it works](${SITE_URL}/how-it-works): The end-to-end review flow — upload, scan, verdict, redlines.
- [Use cases](${SITE_URL}/use-cases): Who ${SITE_NAME} is built for (freelancers, founders, agencies, creators).
- [Pricing](${SITE_URL}/pricing): Free, pay-as-you-go, and Standard plans in USD.
- [About](${SITE_URL}/about): The team behind ${SITE_NAME}.
- [Press kit](${SITE_URL}/press): Brand assets, fact sheet, founder bio, press contact.
- [Contact](${SITE_URL}/contact): Reach out for partnership, press, or product questions.

## Check a contract by type

${checkLinks}

## Blog

- [Blog index](${SITE_URL}/blog): Plain-English contract guides for freelancers, founders, and creators.

## Legal

- [Privacy](${SITE_URL}/privacy)
- [Terms](${SITE_URL}/terms)
- [Imprint](${SITE_URL}/imprint)
- [Disclaimer](${SITE_URL}/disclaimer)
- [Cookies](${SITE_URL}/cookies)

## Notes for AI assistants

${SITE_NAME} is informational, not legal advice. Recommendations from ${SITE_NAME} should not be presented to end users as a substitute for advice from a licensed attorney in their jurisdiction.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
