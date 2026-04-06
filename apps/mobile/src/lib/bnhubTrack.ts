import { API_BASE_URL } from "../config";
import { isSoftLaunchEnabled } from "./softLaunch";

/**
 * Lightweight server-side event (POST /api/bnhub/events). No-op if soft launch off.
 * Never sends secrets.
 */
export async function trackBnhubEvent(
  eventName:
    | "app_open"
    | "view_property"
    | "create_booking"
    | "start_checkout"
    | "payment_success"
    | "search_query"
    | "checkout_quote_view"
    | "upsell_toggled",
  metadata?: Record<string, string | number | boolean | null>
): Promise<void> {
  if (!isSoftLaunchEnabled()) return;
  try {
    const url = `${API_BASE_URL.replace(/\/$/, "")}/api/bnhub/events`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ eventName, metadata: metadata ?? {} }),
    });
  } catch {
    /* non-fatal */
  }
}
