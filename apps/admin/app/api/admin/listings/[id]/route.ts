import { NextRequest } from "next/server";
import { ListingStatus } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { loadStayListingForEditor } from "@/lib/admin/stay-listing-edit";
import { updateListing } from "@/lib/bnhub/listings";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const { row, forbidden } = await loadStayListingForEditor(id, userId);
  if (forbidden) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  const full = await prisma.shortTermListing.findUnique({
    where: { id: row.id },
    include: {
      listingPhotos: { orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }] },
      bnhubHostListingPromotions: { orderBy: { startDate: "desc" }, take: 20 },
      _count: { select: { bookings: true, availability: true } },
    },
  });
  return Response.json({ listing: full });
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const { row, forbidden } = await loadStayListingForEditor(id, userId);
  if (forbidden) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.title === "string") patch.title = body.title.trim();
  if (typeof body.description === "string") patch.description = body.description;
  if (typeof body.city === "string") patch.city = body.city.trim();
  if (typeof body.address === "string") patch.address = body.address.trim();
  if (typeof body.region === "string") patch.region = body.region;
  if (typeof body.country === "string") patch.country = body.country;
  if (body.latitude != null && body.latitude !== "")
    patch.latitude = Number(body.latitude);
  if (body.longitude != null && body.longitude !== "")
    patch.longitude = Number(body.longitude);
  if (body.pricePerNight != null && body.pricePerNight !== "") {
    const n = Number(body.pricePerNight);
    if (Number.isFinite(n) && n >= 0) patch.nightPriceCents = Math.round(n * 100);
  }
  if (typeof body.currency === "string") patch.currency = body.currency;
  if (body.beds != null) patch.beds = Math.max(1, parseInt(String(body.beds), 10) || 1);
  if (body.bedrooms != null) patch.bedrooms = parseInt(String(body.bedrooms), 10);
  if (body.baths != null) patch.baths = Number(body.baths);
  if (body.guests != null || body.maxGuests != null) {
    patch.maxGuests = Math.max(
      1,
      parseInt(String(body.guests ?? body.maxGuests), 10) || 4
    );
  }
  if (Array.isArray(body.amenities))
    patch.amenities = body.amenities.filter((x): x is string => typeof x === "string");
  if (typeof body.houseRules === "string") patch.houseRules = body.houseRules;
  if ("rulesStructured" in body || "listingRulesStructured" in body) {
    patch.listingRulesStructured = body.rulesStructured ?? body.listingRulesStructured;
  }
  if (typeof body.listingStatus === "string") {
    const s = body.listingStatus as ListingStatus;
    if (Object.values(ListingStatus).includes(s)) patch.listingStatus = s;
  }
  if (typeof body.cleaningFee === "number" || typeof body.cleaningFee === "string") {
    const c = Number(body.cleaningFee);
    if (Number.isFinite(c) && c >= 0) patch.cleaningFeeCents = Math.round(c * 100);
  }
  if (typeof body.instantBookEnabled === "boolean") patch.instantBookEnabled = body.instantBookEnabled;

  try {
    const listing = await updateListing(
      id,
      patch as Parameters<typeof updateListing>[1]
    );
    return Response.json({ listing });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed";
    return Response.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const { row, forbidden } = await loadStayListingForEditor(id, userId);
  if (forbidden) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.shortTermListing.update({
    where: { id },
    data: { listingStatus: ListingStatus.UNLISTED },
  });
  return Response.json({ ok: true, listingStatus: ListingStatus.UNLISTED });
}
