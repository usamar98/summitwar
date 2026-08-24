import { ImageResponse } from "next/og";
export const alt =
  "SummitWar — Put your startup at the highest point on the internet";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "linear-gradient(180deg,#07121f,#0b1c29)",
        color: "#f7f2e5",
        padding: 64,
      }}
    >
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: 590,
          bottom: -80,
          width: 0,
          height: 0,
          borderLeft: "370px solid transparent",
          borderRight: "370px solid transparent",
          borderBottom: "0",
          borderTop: "560px solid #213b48",
          transform: "rotate(180deg)",
        }}
      />
      <div
        style={{
          display: "flex",
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: 2,
        }}
      >
        ▲ SUMMIT<span style={{ color: "#f2ca61" }}>WAR</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", width: 820 }}>
        <div style={{ color: "#72c6bc", fontSize: 20, letterSpacing: 5 }}>
          THE WEEKLY STARTUP MOUNTAIN
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 68,
            lineHeight: 1.02,
            fontWeight: 700,
            letterSpacing: -4,
          }}
        >
          Put your startup at the highest point on the internet.
        </div>
      </div>
      <div style={{ display: "flex", color: "#8ea4ab", fontSize: 18 }}>
        $1 = 100 metres · Sponsored placement · Resets Monday 00:00 UTC
      </div>
    </div>,
    size,
  );
}
