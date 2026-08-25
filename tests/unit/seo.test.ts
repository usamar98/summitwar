import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { demoStartups } from "@/lib/demo-data";
import {
  DEFAULT_GOOGLE_SITE_VERIFICATION,
  HOME_TITLE,
  SITE_DESCRIPTION,
  absoluteUrl,
  buildHomeJsonLd,
  buildStartupJsonLd,
  createPageMetadata,
  truncateSearchDescription,
} from "@/lib/seo";

const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

describe("SEO helpers", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = "https://www.summitwar.lol";
  });

  afterAll(() => {
    if (originalAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    }
  });

  it("creates absolute canonical and social image URLs", () => {
    const metadata = createPageMetadata({
      title: "Live Startup Activity",
      description: SITE_DESCRIPTION,
      path: "/activity",
    });

    expect(metadata.alternates).toMatchObject({
      canonical: "https://www.summitwar.lol/activity",
    });
    expect(metadata.openGraph).toMatchObject({
      url: "https://www.summitwar.lol/activity",
      title: "Live Startup Activity | SummitWar",
      images: [
        {
          url: "https://www.summitwar.lol/opengraph-image",
          width: 1200,
          height: 630,
        },
      ],
    });
  });

  it("marks transactional pages as noindex", () => {
    const metadata = createPageMetadata({
      title: "Checkout",
      description: "Complete a sponsored project climb.",
      path: "/checkout",
      noIndex: true,
    });

    expect(metadata.robots).toMatchObject({
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    });
  });

  it("keeps search snippets and titles within useful lengths", () => {
    expect(DEFAULT_GOOGLE_SITE_VERIFICATION).toBe(
      "nPnAOOkPg9Pa9DfhfooIu328_owzvfJlP1VIK52n3jY",
    );
    expect(HOME_TITLE.length).toBeGreaterThanOrEqual(30);
    expect(HOME_TITLE.length).toBeLessThanOrEqual(60);
    expect(SITE_DESCRIPTION.length).toBeGreaterThanOrEqual(120);
    expect(SITE_DESCRIPTION.length).toBeLessThanOrEqual(160);

    const shortened = truncateSearchDescription("word ".repeat(100));
    expect(shortened.length).toBeLessThanOrEqual(158);
    expect(shortened.endsWith("…")).toBe(true);
  });

  it("builds site, application, leaderboard, and profile schema", () => {
    const homeSchema = buildHomeJsonLd(demoStartups.slice(0, 2));
    const profileSchema = buildStartupJsonLd(demoStartups[0]);

    expect(homeSchema["@context"]).toBe("https://schema.org");
    expect(homeSchema["@graph"].map((entry) => entry["@type"])).toEqual([
      "Organization",
      "WebSite",
      "SoftwareApplication",
      "ItemList",
    ]);
    expect(profileSchema["@graph"].map((entry) => entry["@type"])).toEqual([
      "BreadcrumbList",
      "WebPage",
    ]);
    expect(absoluteUrl("/rules")).toBe("https://www.summitwar.lol/rules");
  });
});
