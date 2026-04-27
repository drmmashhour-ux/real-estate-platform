import "server-only";

import { flags } from "@/lib/flags";

/** In-process IP booking velocity (best-effort; use Redis in multi-instance if needed). */
const ipBookingTimestamps = new Map<string, number[]>();

const WINDOW_MS = 60 * 60 * 1000;
const MAX_BOOKINGS_PER_IP_PER_WINDOW = 5;
const MIN_SUBTOTAL_VS_BASE_RATIO = 0.25;
const MAX_SUBTOTAL_VS_BASE_RATIO = 4;

function prune(ip: string, now: number): number[] {
  const raw = ipBookingTimestamps.get(ip) ?? [];
  const next = raw.filter((t) => now - t < WINDOW_MS);
  ipBookingTimestamps.set(ip, next);
  return next;
}

export type BookingFraudInput = {
  clientIp?: string | null;
  /** `nightPriceCents * nights` before discounts/cleaning (listing base). */
  baseStayCents: number;
  /** Server-computed subtotal (lodging + cleaning + addons pre-tax). */
  subtotalCents: number;
};

/**
 * When `FEATURE_COMPLIANCE_HARD_LOCK=1`, blocks abusive patterns. Server must pass `clientIp` when available.
 */
export function assertBookingFraudAllowed(input: BookingFraudInput): void {
  if (!flags.COMPLIANCE_HARD_LOCK) return;

  const ip = input.clientIp?.trim();
  if (ip && ip !== "unknown") {
    const now = Date.now();
    const recent = prune(ip, now);
    if (recent.length >= MAX_BOOKINGS_PER_IP_PER_WINDOW) {
      throw new Error("Too many booking attempts from this network. Try again later or contact support.");
    }
    recent.push(now);
    ipBookingTimestamps.set(ip, recent);
  }

  const base = Math.max(1, input.baseStayCents);
  const ratio = input.subtotalCents / base;
  if (ratio < MIN_SUBTOTAL_VS_BASE_RATIO || ratio > MAX_SUBTOTAL_VS_BASE_RATIO) {
    throw new Error("Pricing for this stay could not be validated. Refresh and try again.");
  }
}
