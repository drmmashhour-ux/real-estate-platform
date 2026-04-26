import { query } from "@/lib/sql";

type FunnelBySourceRow = {
  source: string;
  visits: string;
  signups: string;
  bookings: string;
};

/**
 * Per-source funnel from `growth_events` (30d, `utm_source` as channel). Not the fictional `FunnelMetric` table.
 * Visits: landing + listing + page views. Signups: `signup_success` + `host_signup`. Bookings: `booking_completed`.
 */
export async function getGrowthRecommendations() {
  const rows = await query<FunnelBySourceRow>(`
    SELECT
      COALESCE(NULLIF(TRIM(LOWER("utm_source")), ''), 'direct') AS source,
      COUNT(*) FILTER (
        WHERE "event_name" IN ('landing_view', 'listing_view', 'page_view')
      )::text AS visits,
      COUNT(*) FILTER (
        WHERE "event_name" IN ('signup_success', 'host_signup')
      )::text AS signups,
      COUNT(*) FILTER (WHERE "event_name" = 'booking_completed')::text AS bookings
    FROM growth_events
    WHERE "created_at" >= (NOW() - interval '30 days')
    GROUP BY 1
    HAVING COUNT(*) FILTER (
      WHERE "event_name" IN ('landing_view', 'listing_view', 'page_view')
    ) > 0
       OR COUNT(*) FILTER (WHERE "event_name" IN ('signup_success', 'host_signup')) > 0
       OR COUNT(*) FILTER (WHERE "event_name" = 'booking_completed') > 0
    ORDER BY
      COUNT(*) FILTER (
        WHERE "event_name" IN ('landing_view', 'listing_view', 'page_view')
      ) DESC
    LIMIT 50
  `);

  return rows.map((r) => {
    const visits = Math.max(0, Number(r.visits) || 0);
    const signups = Math.max(0, Number(r.signups) || 0);
    const bookings = Math.max(0, Number(r.bookings) || 0);
    const signupRate = visits > 0 ? signups / visits : 0;
    const bookingRate = signups > 0 ? bookings / signups : 0;

    return {
      source: r.source,
      visits,
      signups,
      bookings,
      signupRate,
      bookingRate,
      recommendation:
        signupRate < 0.05
          ? "Improve landing CTA and trust section"
          : bookingRate < 0.1
            ? "Improve onboarding and booking flow"
            : "Scale traffic source",
    };
  });
}
