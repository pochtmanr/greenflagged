import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#121212",
        }}
      >
        <div
          style={{
            color: "#4A7A5C",
            fontSize: 96,
            fontWeight: 800,
            letterSpacing: -4,
            lineHeight: 1,
          }}
        >
          GF
        </div>
      </div>
    ),
    size
  );
}
