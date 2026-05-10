import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { FAQ } from "@/content/faq";

export function Faq() {
  return (
    <Section id="faq" eyebrow="FAQ" pad="lg">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1fr,2fr]">
          <h2 className="text-display-sm font-bold uppercase leading-[0.95] tracking-[-0.03em]">
            Frequently<br />
            <span className="text-green-300">asked.</span>
          </h2>

          <Accordion type="single" collapsible className="w-full">
            {FAQ.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Container>
    </Section>
  );
}
