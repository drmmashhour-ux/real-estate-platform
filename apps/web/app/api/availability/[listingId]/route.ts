import { marketplacePrisma } from "@/lib/db";

import { getCacheOrRedis, setCacheAndRedis } from "@/lib/cache";
import { activeMarketplaceInventoryFilter } from "@/lib/marketplace/booking-hold";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ listingId: string }> };

/**
 * GET /api/availability/:listingId — date ranges that still hold inventory: confirmed stays and
 * unexpired `pending` holds (Order 62). Expired `pending` rows (and `cancelled` / `expired`) are excluded
 * via `activeMarketplaceInventoryFilter`.
 */
export async function GET(_req: Request, context: Ctx) {
  const { listingId } = await context.params;
  const id = listingId?.trim();
  if (!id) {
    return Response.json({ error: "listingId is required" }, { status: 400 });
  }

  const cacheKey = `availability:GET:${id}`;
  const cached = await getCacheOrRedis(cacheKey);
  if (cached != null) {
    return Response.json(cached);
  }

  const bookings = await marketplacePrisma.booking.findMany({
    where: {
      listingId: id,
      ...activeMarketplaceInventoryFilter(),
    },
    select: {
      startDate: true,
      endDate: true,
    },
    orderBy: { startDate: "asc" },
  });

  await setCacheAndRedis(cacheKey, bookings, 8_000);

  return Response.json(bookings);
}
