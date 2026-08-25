import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SummitWar",
    short_name: "SummitWar",
    description:
      "Discover startups and indie products on a transparent live project leaderboard.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    categories: ["business", "productivity"],
    background_color: "#07101b",
    theme_color: "#07101b",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
