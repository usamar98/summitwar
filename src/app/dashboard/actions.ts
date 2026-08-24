"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizePlainText } from "@/lib/security";

const editSchema = z.object({
  listingId: z.string().uuid(),
  name: z.string().min(1).max(80),
  tagline: z.string().max(160),
  description: z.string().max(5000),
  category: z.string().min(1).max(64),
  founderHandle: z.string().regex(/^@?[A-Za-z0-9_]{1,30}$/),
});

async function assertOwner(userId: string, listingId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("listing_owners")
    .select("listing_id")
    .eq("listing_id", listingId)
    .eq("owner_id", userId)
    .maybeSingle();
  if (!data) throw new Error("Not authorized for this listing");
  return supabase;
}

export async function updateListingAction(formData: FormData) {
  const user = await requireUser();
  const parsed = editSchema.parse(Object.fromEntries(formData));
  const supabase = await assertOwner(user.id, parsed.listingId);
  const update: Record<string, string> = {
    name: sanitizePlainText(parsed.name, 80),
    tagline: sanitizePlainText(parsed.tagline, 160),
    description: sanitizePlainText(parsed.description, 5000),
    category: sanitizePlainText(parsed.category, 64),
    founder_x_handle: parsed.founderHandle.startsWith("@")
      ? parsed.founderHandle
      : `@${parsed.founderHandle}`,
    updated_at: new Date().toISOString(),
  };
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    const allowed = new Set(["image/png", "image/jpeg", "image/webp"]);
    if (!allowed.has(logo.type) || logo.size > 2 * 1024 * 1024)
      throw new Error("Logo must be PNG, JPG, or WebP and no larger than 2MB");
    const extension =
      logo.name
        .split(".")
        .pop()
        ?.toLowerCase()
        .replace(/[^a-z0-9]/g, "") || "bin";
    const path = `${parsed.listingId}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage
      .from("startup-logos")
      .upload(path, logo, { contentType: logo.type, upsert: false });
    if (error) throw new Error("Logo upload failed");
    update.logo_path = path;
    update.logo_url = supabase.storage
      .from("startup-logos")
      .getPublicUrl(path).data.publicUrl;
  }
  const { error } = await supabase
    .from("listings")
    .update(update)
    .eq("id", parsed.listingId);
  if (error) throw new Error("Profile update failed");
  revalidatePath("/dashboard");
}
