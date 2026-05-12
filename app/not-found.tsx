import Link from "next/link";

export default function NotFound() {
  return (
    <section
      className="section"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
        textAlign: "center",
        minHeight: "100vh",
      }}
    >
      <span className="gf-label" style={{ color: "var(--accent-strong)" }}>
        // 404
      </span>
      <h1 className="gf-h1">
        Page not
        <br />
        <span style={{ color: "var(--green-500)" }}>green-flagged.</span>
      </h1>
      <p className="gf-body" style={{ maxWidth: 480 }}>
        The page you&apos;re looking for doesn&apos;t exist — or it never made
        it past review.
      </p>
      <Link href="/" className="gf-btn">
        Back to home <span className="arrow">→</span>
      </Link>
    </section>
  );
}
