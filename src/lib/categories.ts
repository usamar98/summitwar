import type { Startup } from "@/lib/types";

export type CategoryGroup = {
  name: string;
  slug: string;
  projects: Startup[];
  totalHoldCents: number;
  totalClicks: number;
};

export function categorySlug(value: string): string {
  return (
    value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "other"
  );
}

export function groupProjectsByCategory(
  projects: readonly Startup[],
): CategoryGroup[] {
  const groups = new Map<string, CategoryGroup>();

  for (const project of projects) {
    const slug = categorySlug(project.category);
    const existing = groups.get(slug);
    if (existing) {
      existing.projects.push(project);
      existing.totalHoldCents += project.seasonSpendCents;
      existing.totalClicks += project.outboundClicks;
      continue;
    }

    groups.set(slug, {
      name: project.category,
      slug,
      projects: [project],
      totalHoldCents: project.seasonSpendCents,
      totalClicks: project.outboundClicks,
    });
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      projects: group.projects.toSorted(
        (a, b) =>
          (a.currentRank ?? Number.MAX_SAFE_INTEGER) -
            (b.currentRank ?? Number.MAX_SAFE_INTEGER) ||
          b.seasonSpendCents - a.seasonSpendCents,
      ),
    }))
    .toSorted(
      (a, b) =>
        b.projects.length - a.projects.length ||
        b.totalHoldCents - a.totalHoldCents ||
        a.name.localeCompare(b.name),
    );
}

export function findCategoryGroup(
  projects: readonly Startup[],
  slug: string,
): CategoryGroup | undefined {
  return groupProjectsByCategory(projects).find((group) => group.slug === slug);
}
