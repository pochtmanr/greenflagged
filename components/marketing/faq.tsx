"use client";

import * as React from "react";
import { SectionHeading } from "@/components/marketing/section-heading";

const ITEMS = [
  {
    q: "Is my contract private?",
    a:
      "Yes. Files are encrypted in transit and at rest. Free scans are auto-deleted within 30 days; paid plans let you choose 30, 60, or 90 days. We never train models on your contract content.",
  },
  {
    q: "Is this legal advice?",
    a:
      "No. Green Flagged is an informational tool that surfaces risk in plain English. It is not a substitute for advice from a licensed attorney in your jurisdiction. For decisions that matter, talk to a lawyer.",
  },
  {
    q: "What file types do you support?",
    a:
      "PDF and DOCX up to 25 MB, or pasted plain text. Scanned PDFs without an OCR layer aren't supported yet — we're working on it.",
  },
  {
    q: "What does the AI actually check?",
    a:
      "Payment terms, scope, IP transfer, restrictive covenants, liability caps, termination, dispute resolution, and amendment control.",
  },
  {
    q: "How accurate is the analysis?",
    a:
      "Best-in-class language models catch the patterns a careful reader would catch — and a few they'd miss. Treat every verdict as a strong first read, not a final answer.",
  },
  {
    q: "Can I cancel any time?",
    a:
      "Yes. Monthly plans cancel at the end of the current period. Annual plans are eligible for a 14-day full refund.",
  },
];

export function FAQ() {
  const [open, setOpen] = React.useState<number>(0);

  return (
    <section id="faq" className="section">
      <div className="container">
        <SectionHeading
          eyebrow="// 05  Questions"
          lead="Frequently asked."
        />
        <div className="faq">
          {ITEMS.map((it, i) => (
            <div
              key={i}
              className={"faq__row " + (open === i ? "is-open" : "")}
            >
              <button
                type="button"
                className="faq__q"
                aria-expanded={open === i}
                onClick={() => setOpen(open === i ? -1 : i)}
              >
                <span className="faq__n">
                  [{String(i + 1).padStart(2, "0")}]
                </span>
                <span className="faq__qt">{it.q}</span>
                <span className="faq__pm" aria-hidden>
                  {open === i ? "−" : "+"}
                </span>
              </button>
              {open === i ? <p className="faq__a">{it.a}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
