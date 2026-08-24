import type { MetadataRoute } from "next";
import { getPublicAppOrigin } from "@/lib/app-url";
import { getHomeData } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getPublicAppOrigin();
  const data = await getHomeData();
  const staticPages = [
    "",
    "/stats",
    "/hall-of-fame",
    "/activity",
    "/rules",
    "/start",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? ("always" as const) : ("daily" as const),
    priority: path === "" ? 1 : 0.7,
  }));
  const startups = [...data.mountain, ...data.baseCamp].map((item) => ({
    url: `${base}/startup/${item.slug}`,
    lastModified: new Date(item.createdAt),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));
  return [...staticPages, ...startups];
}
