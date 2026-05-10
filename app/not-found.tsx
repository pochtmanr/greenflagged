import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container className="flex min-h-screen flex-col items-center justify-center gap-8 text-center">
      <span className="text-label text-green-300">404</span>
      <h1 className="text-display-sm">
        Page not<br />
        <span className="text-green-300">green-flagged.</span>
      </h1>
      <p className="max-w-md text-body text-text-secondary">
        The page you&apos;re looking for doesn&apos;t exist — or it never made
        it past review.
      </p>
      <Button asChild size="lg" variant="light">
        <Link href="/">
          Back to home
          <span aria-hidden className="btn-arrow transition-transform">→</span>
        </Link>
      </Button>
    </Container>
  );
}
