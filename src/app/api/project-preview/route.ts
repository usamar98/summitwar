import { NextResponse } from "next/server";
import { z } from "zod";
import {
  fetchProjectLogoAsset,
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
  const logo = await fetchProjectLogoAsset(metadata.logoUrls, 256 * 1024);
  const logoDataUrl = logo
    ? `data:${logo.contentType};base64,${Buffer.from(logo.bytes).toString("base64")}`
    : null;

  return NextResponse.json(
    { heading: metadata.heading, logoDataUrl },
    { headers: { "cache-control": "no-store" } },
  );
}
