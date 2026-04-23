import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/require-role";
import { getDistanceKm } from "@/lib/map/radius-search";
import { isComparableListingVisible } from "@/lib/map/comparable-listing";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  city: z.string().min(1).max(120),
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
  radiusKm: z.number().positive().max(50),
  /** Defaults to sold + active approved inventory in the city. */
  statuses: z.array(z.enum(["ACTIVE", "SOLD"])).optional(),
});

export async function POST(req: Request) {
  const auth = await requireRole("broker");
  if (!auth.ok) return auth.response;

  let body: z.infer<typeof bodySchema>;
  try {
    const raw = await req.json();
    body = bodySchema.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const statuses = body.statuses ?? ["SOLD", "ACTIVE"];

  const rows = await prisma.fsboListing.findMany({
    where: {
      city: body.city,
      status: { in: statuses },
      moderationStatus: "APPROVED",
      archivedAt: null,
      latitude: { not: null },
      longitude: { not: null },
    },
    select: {
      id: true,
      address: true,
      city: true,
      priceCents: true,
      latitude: true,
      longitude: true,
      propertyType: true,
      bedrooms: true,
      bathrooms: true,
      surfaceSqft: true,
      status: true,
      moderationStatus: true,
      expiresAt: true,
      archivedAt: true,
    },
    take: 800,
  });

  const visible = rows.filter((c) => isComparableListingVisible(c));

  const filtered = visible.filter((c) => {
    if (c.latitude == null || c.longitude == null) return false;
    const dist = getDistanceKm(body.lat, body.lng, c.latitude, c.longitude);
    return dist <= body.radiusKm;
  });

  return NextResponse.json({
    success: true,
    comps: filtered.map((c) => ({
      id: c.id,
      address: c.address,
      city: c.city,
      salePriceCents: c.priceCents,
      priceCents: c.priceCents,
      latitude: c.latitude,
      longitude: c.longitude,
      propertyType: c.propertyType,
      bedrooms: c.bedrooms,
      bathrooms: c.bathrooms,
      surfaceSqft: c.surfaceSqft,
      listingStatus: c.status,
    })),
  });
}
