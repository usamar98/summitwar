import { getHomeData } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getHomeData();
  return Response.json(
    { season: data.season, mountain: data.mountain, events: data.events },
    { headers: { "Cache-Control": "no-store" } },
  );
}
