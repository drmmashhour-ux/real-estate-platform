import { NextRequest } from "next/server";
import { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { updateListing, type UpdateListingData } from "@/lib/bnhub/listings";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

  const { id } = await ctx.params;
  const row = await prisma.shortTermListing.findUnique({ where: { id } });
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  if (row.ownerId !== userId) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch: UpdateListingData = {};

  if (typeof body.title === "string") patch.title = body.title.trim();
  if (typeof body.city === "string") patch.city = body.city.trim();
  if (typeof body.address === "string") patch.address = body.address.trim();
  if (typeof body.propertyType === "string") patch.propertyType = body.propertyType.trim();
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
  if (typeof body.description === "string") patch.description = body.description;
  if (
    typeof body.listingStatus === "string" &&
    (Object.values(ListingStatus) as string[]).includes(body.listingStatus)
  ) {
    patch.listingStatus = body.listingStatus as ListingStatus;
  }

  const updated = await updateListing(id, patch);
  return Response.json({ listing: updated });
}
