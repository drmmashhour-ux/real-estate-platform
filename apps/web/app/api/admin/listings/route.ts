import { NextRequest } from "next/server";
import { ListingStatus, type Prisma } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@/lib/db";
import { createListing } from "@/lib/bnhub/listings";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await isPlatformAdmin(userId);
  const sp = req.nextUrl.searchParams;
  const status = sp.get("status")?.trim();
  const city = sp.get("city")?.trim();
  const take = Math.min(100, Math.max(1, parseInt(sp.get("limit") ?? "50", 10) || 50));

  const where: Prisma.ShortTermListingWhereInput = {};
  if (!admin) where.ownerId = userId;
  if (status && Object.values(ListingStatus).includes(status as ListingStatus)) {
    where.listingStatus = status as ListingStatus;
  }
  if (city) where.city = { contains: city, mode: "insensitive" };

  const rows = await prisma.shortTermListing.findMany({
    where,
    take,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      listingCode: true,
      title: true,
      city: true,
      listingStatus: true,
      nightPriceCents: true,
      currency: true,
      ownerId: true,
      updatedAt: true,
      _count: { select: { listingPhotos: true, bookings: true } },
    },
  });

  return Response.json({ listings: rows, admin });
}

export async function POST(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await isPlatformAdmin(userId);
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ownerId =
    typeof body.ownerId === "string" && body.ownerId.trim()
      ? body.ownerId.trim()
      : userId;
  if (ownerId !== userId && !admin) {
    return Response.json({ error: "Only admins can create listings for another host" }, { status: 403 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const city = typeof body.city === "string" ? body.city.trim() : "";
  const address = typeof body.address === "string" ? body.address.trim() : "";
  if (!title || !city || !address) {
    return Response.json({ error: "title, city, and address are required" }, { status: 400 });
  }

  const pricePerNight = Number(body.pricePerNight);
  if (!Number.isFinite(pricePerNight) || pricePerNight < 0) {
    return Response.json({ error: "pricePerNight must be a non-negative number" }, { status: 400 });
  }

  const beds = Math.max(1, parseInt(String(body.beds ?? 1), 10) || 1);
  const baths = Math.max(0.5, Number(body.baths) || 1);
  const maxGuests = Math.max(1, parseInt(String(body.guests ?? body.maxGuests ?? 4), 10) || 4);
  const bedrooms =
    body.bedrooms != null && body.bedrooms !== ""
      ? Math.max(0, parseInt(String(body.bedrooms), 10) || 0)
      : undefined;

  const listingStatusRaw = typeof body.listingStatus === "string" ? body.listingStatus : "DRAFT";
  const listingStatus = Object.values(ListingStatus).includes(listingStatusRaw as ListingStatus)
    ? (listingStatusRaw as ListingStatus)
    : ListingStatus.DRAFT;

  const amenities = Array.isArray(body.amenities)
    ? body.amenities.filter((x): x is string => typeof x === "string")
    : [];

  const rulesStructured = body.rulesStructured ?? body.listingRulesStructured;

  const instantBookEnabled = body.instantBookEnabled === true;

  try {
    const listing = await createListing(
      {
        ownerId,
        title,
        description: typeof body.description === "string" ? body.description : "",
        city,
        address,
        region: typeof body.region === "string" ? body.region : undefined,
        country: typeof body.country === "string" ? body.country : "CA",
        latitude:
          body.latitude != null && body.latitude !== "" ? Number(body.latitude) : null,
        longitude:
          body.longitude != null && body.longitude !== "" ? Number(body.longitude) : null,
        nightPriceCents: Math.round(pricePerNight * 100),
        currency: typeof body.currency === "string" ? body.currency : "CAD",
        beds,
        bedrooms: bedrooms ?? beds,
        baths,
        maxGuests,
        photos: [],
        amenities,
        houseRules: typeof body.houseRules === "string" ? body.houseRules : undefined,
        listingRulesStructured: rulesStructured ?? undefined,
        listingStatus,
        instantBookEnabled,
      },
      { skipHostAgreement: admin }
    );
    return Response.json({ listing });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Create failed";
    return Response.json({ error: msg }, { status: 400 });
  }
}
