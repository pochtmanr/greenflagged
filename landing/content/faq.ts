export type FaqItem = { q: string; a: string };

export const FAQ: FaqItem[] = [
  {
    q: "Is my contract private?",
    a: "Yes. Files are encrypted in transit and at rest. Free scans are auto-deleted within 30 days; paid plans let you choose 30, 60, or 90 days. We never train models on your contract content.",
  },
  {
    q: "Is this legal advice?",
    a: "No. Green Flagged is an informational tool that surfaces risk in plain English. It is not a substitute for advice from a licensed attorney in your jurisdiction. For decisions that matter, talk to a lawyer.",
  },
  {
    q: "What file types do you support?",
    a: "PDF and DOCX up to 25 MB, or pasted plain text. Scanned PDFs without an OCR layer aren't supported yet — we're working on it.",
  },
  {
    q: "What does the AI actually check?",
    a: "Payment terms, scope, IP transfer, restrictive covenants, liability caps, termination, dispute resolution, and amendment control. Each flagged clause gets a severity (green / yellow / orange / red), a plain-language explanation, and suggested redline language.",
  },
  {
    q: "How accurate is the analysis?",
    a: "Best-in-class language models catch the patterns a careful reader would catch — and a few they'd miss. They also make occasional mistakes. Treat every verdict as a strong first read, not a final answer. We flag low-confidence findings explicitly.",
  },
  {
    q: "Do you charge VAT?",
    a: "Yes. EU customers see prices including VAT at checkout. Paddle handles VAT compliance as our merchant of record, so you get a compliant invoice automatically.",
  },
  {
    q: "Can I cancel any time?",
    a: "Yes. Monthly plans cancel at the end of the current period. Annual plans are eligible for a 14-day full refund — after that they run through the year you paid for.",
  },
  {
    q: "Does Green Flagged work for German contracts?",
    a: "English is the primary language today, with usable results for German contracts in the meantime. Full German support (Werkvertrag, Dienstvertrag, Arbeitsvertrag) is on the roadmap.",
  },
];
