import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { SITE_URL, SITE_NAME } from "@/lib/config";
import { OrganizationSchema, WebSiteSchema } from "@/lib/seo/json-ld";
// import { ChatWidget } from "@/components/ChatWidget";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Green Flagged — Check any contract online with AI",
    template: "%s · Green Flagged",
  },
  description:
    "Check any contract online in minutes. Green Flagged scans every clause with AI, ranks the risks, and tells you in plain English what to push back on before you sign.",
  keywords: [
    "check contract online",
    "review contract online",
    "AI contract review",
    "AI contract checker",
    "free contract review",
    "free NDA review",
    "freelance contract review",
    "employment contract checker",
    "lease agreement review",
    "contract review online",
    "red flags in contracts",
    "contract scanner",
  ],
  alternates: { canonical: "/" },
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "Legal Technology",
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "Green Flagged — Check any contract online with AI",
    description:
      "AI contract review. Drop a PDF, get a plain-English verdict in minutes. Free, no account needed.",
    siteName: SITE_NAME,
    locale: "en_US",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Green Flagged — AI contract review" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Green Flagged — Check any contract online with AI",
    description: "AI contract review. Get the verdict before you sign.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  verification: {
    google: "nx800vjJFfkPawCgdDeZIoNyNlUph5e5l8NymQwIs_U",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBFAF6" },
    { media: "(prefers-color-scheme: dark)", color: "#0E110F" },
  ],
  width: "device-width",
  initialScale: 1,
};

const themeBootstrap = `(() => {
  try {
    var t = localStorage.getItem('gf-theme');
    if (t === 'light' || t === 'dark') {
      document.documentElement.dataset.theme = t;
    }
  } catch (_) {}
})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        <OrganizationSchema />
        <WebSiteSchema />
        {children}
        <Toaster position="bottom-right" richColors closeButton />
        <Analytics />
        {/* <ChatWidget /> */}
      </body>
    </html>
  );
}
