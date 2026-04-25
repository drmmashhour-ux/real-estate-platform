import { NextRequest } from "next/server";
import { getListingById, setListingPhotos } from "@/lib/bnhub/listings";
import { getGuestId } from "@/lib/auth/session";
import { requireContentLicenseAccepted } from "@/lib/legal/content-license-enforcement";

/** GET /api/bnhub/listings/:id/photos — List photos (ordered, with cover). */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const listing = await getListingById(id);
    if (!listing) return Response.json({ error: "Not found" }, { status: 404 });
    const legacyPhotos = Array.isArray(listing.photos) ? listing.photos : [];
    const photos = listing.listingPhotos?.length
      ? listing.listingPhotos.map((p) => ({ url: p.url, sortOrder: p.sortOrder, isCover: p.isCover }))
      : legacyPhotos.map((url, i) => ({ url, sortOrder: i, isCover: i === 0 }));
    return Response.json(photos);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch photos" }, { status: 500 });
  }
}

/** POST /api/bnhub/listings/:id/photos — Set/replace photos (host only). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
    const { id } = await params;
    const listing = await getListingById(id);
    if (!listing) return Response.json({ error: "Not found" }, { status: 404 });
    if (listing.ownerId !== userId) {
      return Response.json({ error: "Only the host can update photos" }, { status: 403 });
    }
    const licenseBlock = await requireContentLicenseAccepted(userId);
    if (licenseBlock) return licenseBlock;
    const body = await request.json();
    const photos = Array.isArray(body.photos)
      ? body.photos.map((p: string | { url: string; sortOrder?: number; isCover?: boolean }) =>
          typeof p === "string" ? { url: p } : p
        )
      : [];
    const updated = await setListingPhotos(id, photos);
    return Response.json(updated);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to update photos" }, { status: 500 });
  }
}
