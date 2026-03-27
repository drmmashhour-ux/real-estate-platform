import { config } from "../config.js";
import { evaluateFraud } from "../services/operator-service.js";

export async function runFraudScan(): Promise<{ checked: number }> {
  if (!config.bookingsServiceUrl) {
    console.log("[fraud-scan] BOOKINGS_SERVICE_URL not set; skip.");
    return { checked: 0 };
  }
  try {
    const res = await fetch(`${config.bookingsServiceUrl}/bookings/recent?limit=50`);
    const data = res.ok ? await res.json() : { bookings: [] };
    const bookings = Array.isArray(data) ? data : data.bookings ?? [];
    for (const b of bookings) {
      evaluateFraud({ bookingId: b.id, userId: b.guestId ?? b.userId });
    }
    console.log("[fraud-scan] Checked", bookings.length, "bookings");
    return { checked: bookings.length };
  } catch (e) {
    console.error("[fraud-scan]", e);
    return { checked: 0 };
  }
}
