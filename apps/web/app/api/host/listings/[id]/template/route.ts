import { NextRequest } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Owner-only snapshot for cloning into the new-listing wizard (no photos; new draft). */
export async function GET(_req: NextRequest, ctx: Ctx) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

  const { id } = await ctx.params;
  const row = await prisma.shortTermListing.findUnique({
    where: { id },
    select: {
      id: true,
      ownerId: true,
      title: true,
      address: true,
      city: true,
      description: true,
      propertyType: true,
      roomType: true,
      maxGuests: true,
      bedrooms: true,
      beds: true,
      baths: true,
      nightPriceCents: true,
      amenities: true,
    },
  });
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  if (row.ownerId !== userId) return Response.json({ error: "Forbidden" }, { status: 403 });

  const amenitiesRaw = row.amenities;
  const amenitiesList = Array.isArray(amenitiesRaw)
    ? amenitiesRaw.filter((x): x is string => typeof x === "string")
    : [];

  const bedrooms = row.bedrooms ?? row.beds ?? 1;

  return Response.json({
    title: row.title,
    address: row.address,
    city: row.city,
    description: row.description ?? "",
    propertyType: row.propertyType?.trim() || "Apartment",
    roomType: row.roomType?.trim() || "Entire place",
    maxGuests: Math.max(1, row.maxGuests || 4),
    bedrooms: Math.max(0, bedrooms),
    beds: Math.max(1, row.beds || 1),
    baths: Math.max(0.5, row.baths || 1),
    price: Math.max(1, Math.round(row.nightPriceCents / 100)),
    amenities: amenitiesList,
  });
}
