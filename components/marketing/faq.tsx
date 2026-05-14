"use client";

import * as React from "react";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Reveal } from "@/components/marketing/reveal";
import { FAQ as ITEMS } from "@/content/faq";

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
            <Reveal
              key={i}
              as="div"
              className={"faq__row " + (open === i ? "is-open" : "")}
              delayMs={i * 40}
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
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
