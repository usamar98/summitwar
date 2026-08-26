import type { MetadataRoute } from "next";
import { getPublicAppOrigin } from "@/lib/app-url";
import { groupProjectsByCategory } from "@/lib/categories";
import { getHomeData } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getPublicAppOrigin();
  const data = await getHomeData();
  const staticPages: MetadataRoute.Sitemap = [
    { path: "/", changeFrequency: "daily" as const, priority: 1 },
    { path: "/activity", changeFrequency: "hourly" as const, priority: 0.8 },
    { path: "/stats", changeFrequency: "daily" as const, priority: 0.8 },
    {
      path: "/hall-of-fame",
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    { path: "/rules", changeFrequency: "monthly" as const, priority: 0.6 },
    { path: "/about", changeFrequency: "monthly" as const, priority: 0.7 },
    {
      path: "/categories",
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    { path: "/start", changeFrequency: "monthly" as const, priority: 0.7 },
  ].map(({ path, changeFrequency, priority }) => ({
    url: new URL(path, `${base}/`).toString(),
    changeFrequency,
    priority,
  }));
  const startups = [...data.mountain, ...data.baseCamp].map((item) => ({
    url: new URL(`/startup/${item.slug}`, `${base}/`).toString(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));
  const projects = [...data.mountain, ...data.baseCamp];
  const categories = groupProjectsByCategory(projects)
    .filter((group) => group.projects.length >= 2)
    .map((group) => ({
      url: new URL(`/category/${group.slug}`, `${base}/`).toString(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));
  return [...staticPages, ...categories, ...startups];
}
