import { randomUUID } from "crypto";
import { getSupabaseServiceForGuestBookings } from "@/lib/stripe/guestSupabaseBooking";

const BUCKET = "listing-media";

function extFromContentType(ct: string): string {
  const c = ct.toLowerCase();
  if (c.includes("png")) return "png";
  if (c.includes("webp")) return "webp";
  if (c.includes("gif")) return "gif";
  return "jpg";
}

/**
 * Uploads bytes to Supabase Storage and appends a `listing_images` row (public URL).
 * Requires bucket `listing-media` (public read) and service role.
 */
export async function uploadListingImageAndAttach(params: {
  listingId: string;
  bytes: Buffer;
  contentType: string;
}): Promise<{ url: string; imageId: string } | { error: string }> {
  const { listingId, bytes, contentType } = params;
  if (!listingId.trim()) {
    return { error: "listingId is required." };
  }
  if (!contentType.toLowerCase().startsWith("image/")) {
    return { error: "Only image uploads are allowed." };
  }

  const sb = getSupabaseServiceForGuestBookings();
  if (!sb) {
    return { error: "Storage is not configured." };
  }

  const ext = extFromContentType(contentType);
  const path = `${listingId.trim()}/${randomUUID()}.${ext}`;

  const { error: upErr } = await sb.storage.from(BUCKET).upload(path, bytes, {
    contentType,
    upsert: false,
  });

  if (upErr) {
    return { error: upErr.message || "Upload failed." };
  }

  const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(path);
  const url = pub?.publicUrl;
  if (!url) {
    return { error: "Could not resolve public URL for upload." };
  }

  const { data: maxRow } = await sb
    .from("listing_images")
    .select("sort_order")
    .eq("listing_id", listingId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder =
    maxRow && typeof (maxRow as { sort_order?: number }).sort_order === "number"
      ? (maxRow as { sort_order: number }).sort_order + 1
      : 0;

  const { data: inserted, error: insErr } = await sb
    .from("listing_images")
    .insert({ listing_id: listingId, url, sort_order: nextOrder })
    .select("id")
    .single();

  if (insErr || !inserted) {
    return { error: insErr?.message ?? "Could not save image row." };
  }

  return { url, imageId: (inserted as { id: string }).id };
}
