type SectionHeadingProps = {
  eyebrow: string;
  lead: string;
  sub?: string;
};

export function SectionHeading({ eyebrow, lead, sub }: SectionHeadingProps) {
  return (
    <div className="section__heading">
      <span className="gf-label section__eyebrow">{eyebrow}</span>
      <h2 className="gf-h1 section__lead">{lead}</h2>
      {sub ? <p className="gf-body section__sub">{sub}</p> : null}
    </div>
  );
}
