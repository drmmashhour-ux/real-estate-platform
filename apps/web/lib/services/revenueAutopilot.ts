import { query } from "@/lib/sql";

type RevenueListingRow = {
  id: string;
  title: string;
  price: string;
  views: string;
  bookings: string;
};

/**
 * CRM `Listing` rows that are live on the marketplace, with view counts from
 * `event_logs` (listing_view) and booking counts from `listing_bookings`.
 * Conversion proxy: `bookings / max(views, 1)`.
 */
export async function getRevenueOpportunities() {
  const listings = await query<RevenueListingRow>(`
    SELECT
      l."id",
      l."title",
      l."price"::text,
      (SELECT COUNT(*)::text
        FROM "event_logs" e
        WHERE e."listing_id" = l."id"
          AND e."event_type" = 'listing_view'
      ) AS views,
      (SELECT COUNT(*)::text
        FROM "listing_bookings" lb
        WHERE lb."listing_id" = l."id"
      ) AS bookings
    FROM "Listing" l
    WHERE l."crm_marketplace_live" = true
    ORDER BY l."updatedAt" DESC
    LIMIT 200
  `);

  return listings.map((l) => {
    const v = Math.max(0, Number(l.views) || 0);
    const b = Math.max(0, Number(l.bookings) || 0);
    const conversionRate = v > 0 ? b / v : 0;

    return {
      listingId: l.id,
      title: l.title,
      price: Number(l.price) || 0,
      views: v,
      bookings: b,
      conversionRate,
      opportunity:
        conversionRate < 0.02
          ? "Low conversion: improve title, photos, price, or trust signals"
          : "Healthy",
    };
  });
}
