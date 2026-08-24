import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SummitWar",
    short_name: "SummitWar",
    description: "The internet's highest startup position.",
    start_url: "/",
    display: "standalone",
    background_color: "#07101b",
    theme_color: "#07101b",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
