/**
 * Fraud monitoring job (e.g. every 15 min).
 * In production: fetch recent bookings from BOOKINGS_SERVICE_URL, run risk-check per booking, flag high-risk, notify.
 */
import { config } from "../config.js";
import { runRiskCheck } from "../services/risk-check.service.js";

export const JOB_NAME = "fraud-monitoring";

export async function run(): Promise<{ checked: number; flagged: number }> {
  let bookings: { id: string; userId?: string }[] = [];

  if (config.bookingsServiceUrl) {
    try {
      const res = await fetch(`${config.bookingsServiceUrl}/bookings/recent?limit=50`);
      if (res.ok) {
        const data = await res.json();
        bookings = Array.isArray(data) ? data : data.bookings ?? [];
      }
    } catch (e) {
      console.error(`[${JOB_NAME}] Failed to fetch bookings:`, e);
      return { checked: 0, flagged: 0 };
    }
  }

  if (bookings.length === 0) {
    console.log(`[${JOB_NAME}] No recent bookings to check (set BOOKINGS_SERVICE_URL).`);
    return { checked: 0, flagged: 0 };
  }

  let flagged = 0;
  for (const b of bookings) {
    const result = runRiskCheck({ bookingId: b.id, userId: b.userId });
    if (result.recommendedAction === "review" || result.recommendedAction === "block") flagged++;
  }
  console.log(`[${JOB_NAME}] Checked ${bookings.length} bookings, ${flagged} flagged.`);
  return { checked: bookings.length, flagged };
}
