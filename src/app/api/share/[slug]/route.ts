import { getStartupBySlug } from "@/lib/data";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const startup = await getStartupBySlug(slug);
  if (!startup) return Response.json({ error: "Not found" }, { status: 404 });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const text = `${startup.name} reached ${startup.altitudeMeters.toLocaleString()}m and rank #${startup.currentRank ?? "Base Camp"} on @SummitWar.`;
  return Response.redirect(
    `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(`${appUrl}/startup/${startup.slug}`)}`,
  );
}
