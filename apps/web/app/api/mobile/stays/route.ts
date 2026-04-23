import { ListingStatus } from "@prisma/client";

import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

/** BNHub stay cards — published short-term listings only. */
export async function GET() {
  const rows = await prisma.shortTermListing.findMany({
    where: { listingStatus: ListingStatus.PUBLISHED },
    orderBy: { rankingTotalScoreCache: "desc" },
    take: 24,
    select: {
      id: true,
      title: true,
      city: true,
      nightPriceCents: true,
      address: true,
      latitude: true,
      longitude: true,
    },
  });

  return Response.json({
    stays: rows.map((r) => ({
      id: r.id,
      title: r.title,
      city: r.city,
      nightPriceCents: r.nightPriceCents,
      address: r.address,
      lat: r.latitude,
      lng: r.longitude,
    })),
  });
}
