import { getHomeData } from "@/lib/data";

export async function GET() {
  const data = await getHomeData();
  return Response.json(
    { season: data.season, mountain: data.mountain, events: data.events },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=10" } },
  );
}
