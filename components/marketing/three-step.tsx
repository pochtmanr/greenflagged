import { SectionHeading } from "@/components/marketing/section-heading";

const STEPS = [
  {
    n: "01",
    title: "Drop your PDF",
    body:
      "Drag in a contract, paste text, or upload a DOCX. We accept anything you'd sign.",
  },
  {
    n: "02",
    title: "AI ranks every clause",
    body:
      "Each clause is scored for risk. Eight categories, four severity levels, plain English throughout.",
  },
  {
    n: "03",
    title: "Get your verdict",
    body:
      "Green-flagged means safe. Anything else comes with an explanation and a suggested rewrite.",
  },
];

export function ThreeStep() {
  return (
    <section id="how" className="section">
      <div className="container">
        <SectionHeading
          eyebrow="// 01  How it works"
          lead="Three steps. No legalese."
        />
        <div className="three-step">
          {STEPS.map((s) => (
            <div key={s.n} className="gf-frame three-step__card">
              <span className="gf-frame-bl" />
              <span className="gf-frame-br" />
              <span className="gf-label">{s.n} / STEP</span>
              <h3 className="gf-h3 three-step__title">{s.title}</h3>
              <p className="gf-body-sm">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
