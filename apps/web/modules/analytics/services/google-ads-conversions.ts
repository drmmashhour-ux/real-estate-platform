/**
 * Google Ads conversion pings (client-only). Requires `NEXT_PUBLIC_GOOGLE_ADS_ID` on the page
 * (via `GoogleAnalyticsLoader`) and per-action `send_to` labels from Google Ads UI.
 *
 * Values are full `AW-XXXX/YYYY` strings — never fabricate conversions; only call after verified flows.
 */

const KEY_SIGNUP = "lecipm_gads_signup_conv_sent";
const KEY_BOOKING = "lecipm_gads_booking_conv_sent";

function sendTo(kind: "signup" | "booking"): string {
  const raw =
    kind === "signup"
      ? process.env.NEXT_PUBLIC_GOOGLE_ADS_CONV_SIGNUP?.trim() ?? ""
      : process.env.NEXT_PUBLIC_GOOGLE_ADS_CONV_BOOKING?.trim() ?? "";
  return raw;
}

function dedupe(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.sessionStorage.getItem(key)) return false;
    window.sessionStorage.setItem(key, "1");
    return true;
  } catch {
    return true;
  }
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * After a successful `/api/auth/register` response (HTTP 200). Deduped per tab session.
 */
export function reportGoogleAdsSignupConversion(): void {
  const st = sendTo("signup");
  if (!st || typeof window === "undefined" || !window.gtag) return;
  if (!dedupe(KEY_SIGNUP)) return;
  try {
    window.gtag("event", "conversion", { send_to: st });
  } catch {
    /* ignore */
  }
}

/**
 * After a paid/confirmed BNHub stay (`BookingCompletedBeacon` with `paymentConfirmed`).
 * Deduped per booking id in sessionStorage when `bookingId` is passed.
 */
export function reportGoogleAdsBookingConversion(opts?: {
  bookingId?: string;
  valueCents?: number | null;
}): void {
  const st = sendTo("booking");
  if (!st || typeof window === "undefined" || !window.gtag) return;
  const id = opts?.bookingId?.trim();
  const dedupeKey = id ? `${KEY_BOOKING}:${id}` : KEY_BOOKING;
  if (!dedupe(dedupeKey)) return;
  try {
    const params: Record<string, unknown> = { send_to: st };
    if (opts?.valueCents != null && Number.isFinite(opts.valueCents) && opts.valueCents > 0) {
      params.value = opts.valueCents / 100;
      params.currency = "CAD";
    }
    window.gtag("event", "conversion", params);
  } catch {
    /* ignore */
  }
}
