import "server-only";

import { createAdminClient, hasAdminSupabaseEnv } from "@/lib/supabase/admin";
import {
  fetchProjectFaviconAsset,
  fetchProjectMetadata,
} from "@/lib/project-metadata";

export type ListingMetadataRefresh = {
  heading: string | null;
  logoUrl: string | null;
  updated: boolean;
};

export async function refreshListingMetadata({
  id,
  website,
  currentLogoUrl,
}: {
  id: string;
  website: string;
  currentLogoUrl: string | null;
}): Promise<ListingMetadataRefresh> {
  if (!hasAdminSupabaseEnv()) {
    return { heading: null, logoUrl: currentLogoUrl, updated: false };
  }

  const metadata = await fetchProjectMetadata(website);
  const update: Record<string, string> = {};
  if (metadata.heading) update.tagline = metadata.heading;

  let logoUrl = currentLogoUrl;
  const shouldReplaceWithFavicon =
    !logoUrl || logoUrl.includes("/auto-") || logoUrl.includes("%2Fauto-");
  if (shouldReplaceWithFavicon && metadata.faviconUrls.length) {
    const favicon = await fetchProjectFaviconAsset(metadata.faviconUrls);
    if (favicon) {
      const supabase = createAdminClient();
      const logoPath = `${id}/favicon-${crypto.randomUUID()}.${favicon.extension}`;
      const { error: uploadError } = await supabase.storage
        .from("startup-logos")
        .upload(logoPath, favicon.bytes, {
          contentType: favicon.contentType,
          upsert: false,
        });
      if (!uploadError) {
        logoUrl = supabase.storage.from("startup-logos").getPublicUrl(logoPath)
          .data.publicUrl;
        update.logo_path = logoPath;
        update.logo_url = logoUrl;
      }
    }
  }

  if (!Object.keys(update).length) {
    return { heading: metadata.heading, logoUrl, updated: false };
  }

  update.updated_at = new Date().toISOString();
  const supabase = createAdminClient();
  const { error } = await supabase.from("listings").update(update).eq("id", id);
  if (error)
    throw new Error(`Project metadata update failed: ${error.message}`);
  return { heading: metadata.heading, logoUrl, updated: true };
}
