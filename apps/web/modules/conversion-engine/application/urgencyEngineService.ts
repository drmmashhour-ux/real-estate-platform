import type { PrismaClient } from "@prisma/client";

export async function buildUrgencySignal(db: PrismaClient, listingId: string) {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const pathToken = `%${listingId}%`;
  const views = await db.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint as count
    FROM traffic_events
    WHERE event_type = 'listing_view'
      AND created_at >= ${last24h}
      AND path ILIKE ${pathToken}
  `;
  const viewCount = Number(views[0]?.count ?? 0);
  const demandLevel = viewCount >= 35 ? "high" : viewCount >= 12 ? "medium" : "early";
  const message =
    demandLevel === "high"
      ? "Trending property: high demand in the last 24h."
      : demandLevel === "medium"
        ? "Growing attention: multiple buyers viewed this recently."
        : "Early-stage signal: views are still building.";
  return {
    listingId,
    viewCount24h: viewCount,
    demandLevel,
    message,
  };
}
