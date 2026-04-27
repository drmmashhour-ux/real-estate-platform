import { query } from "@/lib/sql";
import { GrowthEventName } from "@/modules/growth/event-types";

export type AbGrowthAggregateRow = {
  experiment: string | null;
  variant: string | null;
  exposures: string;
  conversions: string;
};

/**
 * Last N days of A/B exposures vs `booking_completed` in `growth_events` (see `/api/ab/results`).
 */
export async function loadAbAggregateRowsFromGrowth(days: number = 7): Promise<AbGrowthAggregateRow[]> {
  const safeDays = Math.max(1, Math.min(180, Math.floor(Number(days) || 7)));
  const sql = `
    SELECT
      COALESCE(metadata->>'experiment', metadata->>'experimentId') AS experiment,
      metadata->>'variant' AS variant,
      COUNT(*) FILTER (WHERE event_name = $1) AS exposures,
      COUNT(*) FILTER (WHERE event_name = $2) AS conversions
    FROM growth_events
    WHERE created_at > NOW() - $3::interval
      AND (event_name = $1 OR event_name = $2)
    GROUP BY 1, 2
    HAVING COALESCE(metadata->>'experiment', metadata->>'experimentId') IS NOT NULL
      AND metadata->>'variant' IS NOT NULL
    ORDER BY experiment ASC NULLS LAST, variant ASC NULLS LAST
  `.trim();

  return query<AbGrowthAggregateRow>(sql, [
    GrowthEventName.AB_EXPOSURE,
    GrowthEventName.BOOKING_COMPLETED,
    `${safeDays} days`,
  ]);
}
