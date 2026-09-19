import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 80,
        color: "white",
        background: "linear-gradient(125deg, #081326, #164394)",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", fontSize: 108, fontWeight: 700, letterSpacing: -5 }}>
        neMalika
      </div>
      <div style={{ display: "flex", fontSize: 42, marginTop: 28, color: "#c4d9ff" }}>
        Malika tech marketplace · Tashkent
      </div>
      <div style={{ display: "flex", fontSize: 30, marginTop: 60, color: "#83b5ff" }}>
        nemalika.uz
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
