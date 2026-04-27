import { query } from "@/lib/sql";

/**
 * @domain engagement — weekly AI value summary (email/dashboard wiring later).
 * Counts `ai_execution_logs` for rows whose `listing_id` belongs to the host (join on `bnhub_listings.host_id`);
 * the log table has no `userId` column.
 * Optional: when `revenue_delta` is added to `ai_execution_logs`, extend the SELECT with
 * `COALESCE(SUM((e.after_snapshot->>'revenueCents')::numeric),0)` (or a real column) and map `revenueImpact`.
 */
export async function generateWeeklyReport(userId: string) {
  const rows = await query<{ optimizations: string }>(
    `SELECT COUNT(e.id)::text AS optimizations
     FROM ai_execution_logs e
     INNER JOIN bnhub_listings l ON l.id = e.listing_id
    WHERE l.host_id = $1
      AND e.created_at > NOW() - INTERVAL '7 days'`,
    [userId]
  );

  const first = rows[0];
  const report = {
    userId,
    optimizations: first ? Number(first.optimizations) : 0,
    revenueImpact: null as null | { cents: number },
    message: "Your listings improved this week 🚀" as const,
  };
  console.log("[WEEKLY REPORT]", report);
  return report;
}
