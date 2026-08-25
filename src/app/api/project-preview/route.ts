import { NextResponse } from "next/server";
import { z } from "zod";
import {
  fetchProjectFaviconAsset,
  fetchProjectMetadata,
} from "@/lib/project-metadata";
import { allowInMemoryRequest, normalizePublicUrl } from "@/lib/security";

export const runtime = "nodejs";

const previewSchema = z.object({
  website: z.string().trim().min(3).max(2048),
});

export async function POST(request: Request) {
  const forwarded =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!allowInMemoryRequest(`project-preview:${forwarded}`, 12, 60)) {
    return NextResponse.json(
      { error: "Too many preview requests. Try again shortly." },
      { status: 429 },
    );
  }

  const parsed = previewSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid project link." },
      { status: 400 },
    );
  }

  let website: string;
  try {
    website = normalizePublicUrl(parsed.data.website);
  } catch {
    return NextResponse.json(
      { error: "Enter a valid public project link." },
      { status: 400 },
    );
  }

  const metadata = await fetchProjectMetadata(website);
  const favicon = await fetchProjectFaviconAsset(
    metadata.faviconUrls,
    256 * 1024,
  );
  const faviconDataUrl = favicon
    ? `data:${favicon.contentType};base64,${Buffer.from(favicon.bytes).toString("base64")}`
    : null;

  return NextResponse.json(
    { heading: metadata.heading, faviconDataUrl },
    { headers: { "cache-control": "no-store" } },
  );
}
