import { ImageResponse } from "next/og";
import { getHomeData, getStartupBySlug } from "@/lib/data";

const messages: Record<
  string,
  (name: string, rank: number | null, altitude: number, gap: number) => string
> = {
  new: (name) => `${name} just joined SummitWar.`,
  rank: (name, rank, altitude) =>
    `${name} reached ${altitude.toLocaleString()}m · #${rank ?? "Base Camp"}.`,
  summit: (name) =>
    `${name} just captured the internet's highest startup position.`,
  overtaken: (name) => `${name} was overtaken. The climb continues.`,
  champion: (name) => `${name} is this week's SummitWar champion.`,
  season: () => "A new Avalanche Season has begun.",
  "top-ten": (_name, _rank, _altitude, gap) =>
    `The current top ten · only $${gap} separates the summit.`,
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string; slug: string }> },
) {
  const { kind, slug } = await params;
  const [startup, home] = await Promise.all([
    getStartupBySlug(slug),
    getHomeData(),
  ]);
  const item = startup ?? home.mountain[0];
  const name = item?.name ?? "Your startup";
  const rank = item?.currentRank ?? null;
  const altitude = item?.altitudeMeters ?? 0;
  const gap = Math.max(
    1,
    Math.ceil(
      ((home.mountain[0]?.seasonSpendCents ?? 0) -
        (item?.seasonSpendCents ?? 0) +
        100) /
        100,
    ),
  );
  const message = (messages[kind] ?? messages.rank)(name, rank, altitude, gap);
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#07111c",
        color: "#f5f3e9",
        padding: 64,
        position: "relative",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          position: "absolute",
          width: 620,
          height: 620,
          borderRadius: 620,
          background: "rgba(255,205,91,.14)",
          right: -180,
          top: -250,
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: 23,
          fontWeight: 700,
          letterSpacing: 2,
        }}
      >
        ▲ SUMMIT<span style={{ color: "#f3c85a" }}>WAR</span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 780 }}>
          <div
            style={{
              color: "#78c8bf",
              fontSize: 20,
              textTransform: "uppercase",
              letterSpacing: 5,
            }}
          >
            WEEKLY STARTUP MOUNTAIN
          </div>
          <div
            style={{
              fontSize: 57,
              lineHeight: 1.06,
              letterSpacing: -3,
              fontWeight: 700,
              marginTop: 22,
            }}
          >
            {message}
          </div>
          <div
            style={{
              display: "flex",
              gap: 28,
              marginTop: 30,
              color: "#9fb1b7",
              fontSize: 21,
            }}
          >
            <span>{altitude.toLocaleString()}m altitude</span>
            <span>{rank ? `Rank #${rank}` : "Base Camp"}</span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            width: 210,
            height: 210,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 44,
            border: "5px solid #f3c85a",
            background: "#152531",
            fontSize: 54,
            fontWeight: 800,
          }}
        >
          {name
            .split(/\s+/)
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>
      </div>
      <div style={{ display: "flex", color: "#6f858d", fontSize: 17 }}>
        Sponsored placement · summitwar.lol
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
