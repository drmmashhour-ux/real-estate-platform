import { randomUUID } from "crypto";
import { getSupabaseServiceForGuestBookings } from "@/lib/stripe/guestSupabaseBooking";
import { scanBufferBeforeStorage } from "@/lib/security/malware-scan";

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
}): Promise<{ url: string } | { error: string; status?: number }> {
  const { listingId, bytes, contentType } = params;
  if (!listingId.trim()) return { error: "listingId is required." };
  if (!contentType.toLowerCase().startsWith("image/")) return { error: "Only image uploads are allowed." };

  const scan = await scanBufferBeforeStorage({
    bytes,
    mimeType: contentType,
    context: "bnhub_stay_listing_public",
  });
  if (!scan.ok) {
    return { error: scan.userMessage, status: scan.status };
  }

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
