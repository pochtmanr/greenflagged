import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "@napi-rs/canvas"],
  images: {
    qualities: [75, 85],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.greenflagged.xyz" }],
        destination: "https://greenflagged.xyz/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
