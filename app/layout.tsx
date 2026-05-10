import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://greenflagged.app"),
  title: {
    default: "Green Flagged — Get your contract green-flagged before you sign",
    template: "%s · Green Flagged",
  },
  description:
    "Drop any contract. Our AI scans every clause, ranks the risks, and tells you exactly what to push back on. Free. No account needed.",
  keywords: [
    "contract review",
    "AI contract analysis",
    "freelance contract",
    "red flags",
    "legal AI",
    "contract scanner",
    "NDA review",
  ],
  authors: [{ name: "Green Flagged" }],
  creator: "Green Flagged",
  openGraph: {
    type: "website",
    url: "https://greenflagged.app",
    title: "Green Flagged — Get your contract green-flagged before you sign",
    description:
      "AI contract review. Drop a PDF, get a plain-English verdict in minutes.",
    siteName: "Green Flagged",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Green Flagged" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Green Flagged",
    description: "AI contract review. Get the verdict before you sign.",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#121212",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
