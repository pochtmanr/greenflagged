import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section className="relative bg-green-100 py-24 text-green-950 md:py-32">
      <Container>
        <div className="flex flex-col items-start gap-12 md:flex-row md:items-end md:justify-between">
          <h2 className="text-display max-w-3xl">
            Don&apos;t sign<br />
            anything risky.
          </h2>
          <div className="flex flex-col items-start gap-6">
            <p className="max-w-sm text-body text-green-950/70">
              Drop your contract. Get a verdict. The first one is free, and you
              don&apos;t need an account.
            </p>
            <Button asChild size="lg" variant="dark">
              <Link href="/#hero-drop">
                Try one free
                <ArrowRight className="btn-arrow size-4 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
