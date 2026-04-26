import { query } from "@/lib/sql";

type ListingIntelligenceRow = {
  id: string;
  title: string;
  price: string;
  crm_marketplace_live: string; // "true" | "false" from ::text
  oaciqHold: boolean;
  views: string;
  bookings: string;
};

/**
 * CRM residential listings visible to a broker: rows they own (`user_id`) or can access
 * via `broker_listing_access`. `brokerId` is the broker’s `User.id`.
 *
 * `views` / `bookings` follow `getRevenueOpportunities` — `event_logs` listing views + `listing_bookings` counts.
 */
export async function getBrokerIntelligence(brokerId: string) {
  const listings = await query<ListingIntelligenceRow>(
    `
    SELECT
      l."id",
      l."title",
      l."price"::text,
      l."crm_marketplace_live"::text,
      (l."lecipm_oaciq_compliance_hold_at" IS NOT NULL) AS "oaciqHold",
      (
        SELECT COUNT(*)::text
        FROM "event_logs" e
        WHERE e."listing_id" = l."id"
          AND e."event_type" = 'listing_view'
      ) AS "views",
      (
        SELECT COUNT(*)::text
        FROM "listing_bookings" lb
        WHERE lb."listing_id" = l."id"
      ) AS "bookings"
    FROM "Listing" l
    WHERE l."user_id" = $1
      OR EXISTS (
        SELECT 1
        FROM "broker_listing_access" bla
        WHERE bla."listing_id" = l."id"
          AND bla."broker_id" = $1
      )
    ORDER BY l."updatedAt" DESC
    LIMIT 200
  `,
    [brokerId]
  );

  return listings.map((l) => {
    const v = Math.max(0, Number(l.views) || 0);
    const b = Math.max(0, Number(l.bookings) || 0);
    const conversionRate = v > 0 ? b / v : 0;
    const live = l.crm_marketplace_live === "true";
    const status = l.oaciqHold
      ? "compliance_hold"
      : live
        ? "marketplace_live"
        : "not_on_marketplace";

    return {
      listingId: l.id,
      title: l.title,
      price: Number(l.price) || 0,
      views: v,
      bookings: b,
      status,
      crmMarketplaceLive: live,
      conversionRate,
      recommendation:
        conversionRate < 0.02
          ? "Improve price, photos, description, or trust signals"
          : "Listing is performing normally",
    };
  });
}

export type BrokerIntelligenceInsight = Awaited<ReturnType<typeof getBrokerIntelligence>>[number];
