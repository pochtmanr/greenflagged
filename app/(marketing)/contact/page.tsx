import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { ContactForm } from "@/components/sections/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Green Flagged. We answer within one business day.",
};

export default function ContactPage() {
  return (
    <Section pad="lg">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1fr,1fr] lg:gap-16">
          <div>
            <span className="text-label text-green-300">Contact</span>
            <h1 className="mt-4 text-display-sm font-bold uppercase leading-[0.95] tracking-[-0.03em]">
              Say hi.
            </h1>
            <p className="mt-6 text-base leading-7 text-text-secondary">
              Questions, partnership, press, or just want to know what we&apos;re
              building next? Drop a note. We answer within one business day.
            </p>
            <p className="mt-8 text-sm text-text-secondary">
              Prefer email?{" "}
              <a
                className="text-green-300 hover:underline"
                href="mailto:hello@greenflagged.app"
              >
                hello@greenflagged.app
              </a>
            </p>
          </div>
          <ContactForm />
        </div>
      </Container>
    </Section>
  );
}
