import type { Metadata } from "next";
import { ContactForm } from "@/components/sections/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Green Flagged. We answer within one business day.",
};

export default function ContactPage() {
  return (
    <section className="section" style={{ paddingTop: 144 }}>
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 64,
          }}
          className="contact__grid"
        >
          <div>
            <span className="gf-label">// CONTACT</span>
            <h1 className="gf-h1" style={{ marginTop: 14 }}>
              Say hi.
            </h1>
            <p className="gf-body" style={{ marginTop: 24, fontSize: 17 }}>
              Questions, partnership, press, or just want to know what
              we&apos;re building next? Drop a note. We answer within one
              business day.
            </p>
            <p className="gf-body-sm" style={{ marginTop: 32 }}>
              Prefer email?{" "}
              <a
                href="mailto:hello@greenflagged.xyz"
                style={{
                  color: "var(--fg-1)",
                  borderBottom: "1px solid currentColor",
                }}
              >
                hello@greenflagged.xyz
              </a>
            </p>
          </div>
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
