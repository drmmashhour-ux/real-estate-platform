import { ListingStatus } from "@prisma/client";
import { prisma } from "@repo/db";
import { updateListing, type UpdateListingData } from "@/lib/bnhub/listings";
import { logPricingAiApplied } from "@/modules/pricing-ai/pricing-ai.logger";

export async function patchShortTermListingForHost(
  hostId: string,
  listingId: string,
  body: Record<string, unknown>
): Promise<{ ok: true; listing: Awaited<ReturnType<typeof updateListing>> } | { ok: false; status: 404 | 403 }> {
  const row = await prisma.shortTermListing.findUnique({ where: { id: listingId } });
  if (!row) return { ok: false, status: 404 };
  if (row.ownerId !== hostId) return { ok: false, status: 403 };

  const patch: UpdateListingData = {};

  if (typeof body.title === "string") patch.title = body.title.trim();
  if (typeof body.city === "string") patch.city = body.city.trim();
  if (typeof body.address === "string") patch.address = body.address.trim();
  if (typeof body.propertyType === "string") patch.propertyType = body.propertyType.trim();
  if (typeof body.roomType === "string") patch.roomType = body.roomType.trim();
  if (body.maxGuests != null) patch.maxGuests = Math.max(1, parseInt(String(body.maxGuests), 10) || 1);
  if (body.bedrooms != null) patch.bedrooms = Math.max(0, parseInt(String(body.bedrooms), 10) || 0);
  if (body.beds != null) patch.beds = Math.max(1, parseInt(String(body.beds), 10) || 1);
  if (body.baths != null) patch.baths = Math.max(0.5, Number(body.baths) || 1);
  if (Array.isArray(body.amenities)) {
    patch.amenities = body.amenities.filter((x): x is string => typeof x === "string");
  }
  if (body.pricePerNight != null) {
    const n = Number(body.pricePerNight);
    if (Number.isFinite(n) && n >= 0) patch.nightPriceCents = Math.round(n * 100);
  }
  if (body.nightPriceCents != null) {
    const n = Number(body.nightPriceCents);
    if (Number.isFinite(n) && n >= 50) patch.nightPriceCents = Math.round(n);
  }
  if (typeof body.description === "string") patch.description = body.description;
  if (
    typeof body.listingStatus === "string" &&
    (Object.values(ListingStatus) as string[]).includes(body.listingStatus)
  ) {
    patch.listingStatus = body.listingStatus as ListingStatus;
  }

  const pricingAiApplied = body.pricingAiApplied === true;
  const updated = await updateListing(listingId, patch);
  if (pricingAiApplied && typeof patch.nightPriceCents === "number") {
    logPricingAiApplied({
      listingId: listingId.slice(0, 8),
      nightPriceCents: patch.nightPriceCents,
    });
  }
  return { ok: true, listing: updated };
}
