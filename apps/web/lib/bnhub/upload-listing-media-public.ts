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

/** Upload image bytes to Supabase `listing-media` and return a public URL (no `listing_images` row). */
export async function uploadStayListingImagePublicUrl(params: {
  listingId: string;
  bytes: Buffer;
  contentType: string;
}): Promise<{ url: string } | { error: string }> {
  const { listingId, bytes, contentType } = params;
  if (!listingId.trim()) return { error: "listingId is required." };
  if (!contentType.toLowerCase().startsWith("image/")) return { error: "Only image uploads are allowed." };

  const sb = getSupabaseServiceForGuestBookings();
  if (!sb) return { error: "Storage is not configured." };

  const ext = extFromContentType(contentType);
  const path = `${listingId.trim()}/${randomUUID()}.${ext}`;
  const { error: upErr } = await sb.storage.from(BUCKET).upload(path, bytes, { contentType, upsert: false });
  if (upErr) return { error: upErr.message || "Upload failed." };

  const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(path);
  const url = pub?.publicUrl;
  if (!url) return { error: "Could not resolve public URL for upload." };
  return { url };
}
