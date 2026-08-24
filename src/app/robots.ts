import type { MetadataRoute } from "next";
import { getPublicAppOrigin } from "@/lib/app-url";

export default function robots(): MetadataRoute.Robots {
  const base = getPublicAppOrigin();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/dashboard", "/login", "/checkout", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
