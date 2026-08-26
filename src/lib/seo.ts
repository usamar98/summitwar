import type { Metadata } from "next";
import { getPublicAppOrigin } from "@/lib/app-url";
import type { CategoryGroup } from "@/lib/categories";
import type { Startup } from "@/lib/types";

export const SITE_NAME = "SummitWar";
export const HOME_PAGE_TITLE = "Startup Leaderboard & Project Discovery";
export const HOME_TITLE = `${HOME_PAGE_TITLE} | ${SITE_NAME}`;
export const SITE_DESCRIPTION =
  "Discover ambitious startups and indie products on SummitWar's live startup leaderboard. Explore transparent rankings or submit your project and climb from $1.";
export const DEFAULT_GOOGLE_SITE_VERIFICATION =
  "nPnAOOkPg9Pa9DfhfooIu328_owzvfJlP1VIK52n3jY";
export const GOOGLE_SITE_VERIFICATION =
  process.env.GOOGLE_SITE_VERIFICATION?.trim() ||
  DEFAULT_GOOGLE_SITE_VERIFICATION;

const DEFAULT_SOCIAL_IMAGE = "/opengraph-image";

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  imagePath?: string;
  imageAlt?: string;
  noIndex?: boolean;
};

export function absoluteUrl(path = "/"): string {
  return new URL(path, `${getPublicAppOrigin()}/`).toString();
}

export function createPageMetadata({
  title,
  description,
  path,
  imagePath = DEFAULT_SOCIAL_IMAGE,
  imageAlt = `${SITE_NAME} live startup leaderboard`,
  noIndex = false,
}: PageMetadataOptions): Metadata {
  const canonical = absoluteUrl(path);
  const socialTitle = title.includes(SITE_NAME)
    ? title
    : `${title} | ${SITE_NAME}`;
  const image = absoluteUrl(imagePath);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: socialTitle,
      description,
      url: canonical,
      images: [{ url: image, width: 1200, height: 630, alt: imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [{ url: image, alt: imageAlt }],
    },
    ...(noIndex
      ? {
          robots: {
            index: false,
            follow: false,
            googleBot: { index: false, follow: false },
          },
        }
      : {}),
  };
}

export function truncateSearchDescription(value: string, max = 158): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;

  const shortened = normalized.slice(0, max - 1);
  const lastSpace = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, Math.max(lastSpace, max - 24)).trimEnd()}…`;
}

export function buildHomeJsonLd(startups: Startup[]) {
  const home = absoluteUrl("/");
  const websiteId = `${home}#website`;
  const organizationId = `${home}#organization`;
  const applicationId = `${home}#application`;
  const leaderboard = startups.slice(0, 10);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: SITE_NAME,
        url: home,
        logo: {
          "@type": "ImageObject",
          url: absoluteUrl("/icon.svg"),
        },
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: SITE_NAME,
        alternateName: "Summit War",
        url: home,
        description: SITE_DESCRIPTION,
        inLanguage: "en",
        publisher: { "@id": organizationId },
      },
      {
        "@type": "SoftwareApplication",
        "@id": applicationId,
        name: SITE_NAME,
        url: home,
        description: SITE_DESCRIPTION,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Startup leaderboard",
        operatingSystem: "Any modern web browser",
        isAccessibleForFree: true,
        featureList: [
          "Live startup and project leaderboard",
          "Transparent sponsored rankings",
          "Weekly ranking seasons",
          "Public project profiles and ranking history",
        ],
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          url: home,
          description: "Free startup discovery and leaderboard access",
        },
        publisher: { "@id": organizationId },
      },
      ...(leaderboard.length
        ? [
            {
              "@type": "ItemList",
              "@id": `${home}#startup-leaderboard`,
              name: "SummitWar live startup leaderboard",
              numberOfItems: leaderboard.length,
              itemListOrder: "https://schema.org/ItemListOrderAscending",
              itemListElement: leaderboard.map((startup, index) => {
                const profileUrl = absoluteUrl(`/startup/${startup.slug}`);
                return {
                  "@type": "ListItem",
                  position: index + 1,
                  item: {
                    "@type": "WebPage",
                    "@id": profileUrl,
                    name: startup.name,
                    description: startup.tagline,
                    url: profileUrl,
                  },
                };
              }),
            },
          ]
        : []),
    ],
  };
}

export function buildStartupJsonLd(startup: Startup) {
  const home = absoluteUrl("/");
  const profile = absoluteUrl(`/startup/${startup.slug}`);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Startup leaderboard",
            item: home,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: startup.name,
            item: profile,
          },
        ],
      },
      {
        "@type": "WebPage",
        "@id": profile,
        name: `${startup.name} startup profile and ranking`,
        description: startup.tagline,
        url: profile,
        isPartOf: { "@id": `${home}#website` },
        about: {
          "@type": "Thing",
          name: startup.name,
          description: startup.description,
          url: startup.website,
        },
      },
    ],
  };
}

function projectListItems(startups: readonly Startup[]) {
  return startups.map((startup, index) => {
    const profileUrl = absoluteUrl(`/startup/${startup.slug}`);
    return {
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "WebPage",
        "@id": profileUrl,
        name: startup.name,
        description: startup.tagline,
        url: profileUrl,
      },
    };
  });
}

export function buildCategoriesJsonLd(groups: readonly CategoryGroup[]) {
  const page = absoluteUrl("/categories");
  const home = absoluteUrl("/");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Startup leaderboard",
            item: home,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Project categories",
            item: page,
          },
        ],
      },
      {
        "@type": "CollectionPage",
        "@id": page,
        name: "Startup and indie project categories",
        description:
          "Browse approved startups and indie products by category on SummitWar.",
        url: page,
        isPartOf: { "@id": `${home}#website` },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: groups.length,
          itemListElement: groups.map((group, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: group.name,
            url: absoluteUrl(`/category/${group.slug}`),
          })),
        },
      },
    ],
  };
}

export function buildCategoryJsonLd(
  group: CategoryGroup,
  startups: readonly Startup[],
) {
  const page = absoluteUrl(`/category/${group.slug}`);
  const categories = absoluteUrl("/categories");
  const home = absoluteUrl("/");
  const listId = `${page}#projects`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Startup leaderboard",
            item: home,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Project categories",
            item: categories,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: group.name,
            item: page,
          },
        ],
      },
      {
        "@type": "CollectionPage",
        "@id": page,
        name: `${group.name} startups and indie projects`,
        description: `Discover ${group.name} projects competing on SummitWar's transparent sponsored leaderboard.`,
        url: page,
        isPartOf: { "@id": `${home}#website` },
        mainEntity: { "@id": listId },
      },
      {
        "@type": "ItemList",
        "@id": listId,
        name: `${group.name} project leaderboard`,
        numberOfItems: startups.length,
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        itemListElement: projectListItems(startups),
      },
    ],
  };
}
