import "server-only";

import { flags } from "@/lib/flags";

/** In-process IP booking velocity (best-effort; use Redis in multi-instance if needed). */
const ipBookingTimestamps = new Map<string, number[]>();
/** In-process per-user (guest) booking attempts — enforced even when client IP is missing. */
const userBookingTimestamps = new Map<string, number[]>();

const WINDOW_MS = 60 * 60 * 1000;
const MAX_BOOKINGS_PER_IP_PER_WINDOW = 5;
const MAX_BOOKINGS_PER_USER_PER_WINDOW = 5;
const MIN_SUBTOTAL_VS_BASE_RATIO = 0.25;
const MAX_SUBTOTAL_VS_BASE_RATIO = 4;

function warnBlock(
  input: { clientIp?: string | null; userId?: string | null },
  reason: string
): void {
  const ip = input.clientIp?.trim();
  const userId = input.userId?.trim();
  console.warn("FRAUD BLOCK:", { ip: ip && ip !== "unknown" ? ip : null, userId: userId || null, reason });
}

function prune(map: Map<string, number[]>, key: string, now: number): number[] {
  const raw = map.get(key) ?? [];
  const next = raw.filter((t) => now - t < WINDOW_MS);
  map.set(key, next);
  return next;
}

export type BookingFraudInput = {
  clientIp?: string | null;
  /** Guest user id — used for per-user velocity when IP is missing or untrusted. */
  userId?: string | null;
  /** `nightPriceCents * nights` before discounts (lodging subtotal, pre-discount). */
  baseStayCents: number;
  /** Server-computed subtotal (lodging + cleaning + addons pre-tax). */
  subtotalCents: number;
};

/**
 * When `FEATURE_COMPLIANCE_HARD_LOCK=1`, blocks abusive patterns.
 * - IP velocity when a real client IP is present
 * - User velocity (max 5/hour) always when `userId` is set — runs even if `clientIp` is missing
 * - Subtotal vs base ratio bounds
 */
export function assertBookingFraudAllowed(input: BookingFraudInput): void {
  if (!flags.COMPLIANCE_HARD_LOCK) return;

  const now = Date.now();
  const ip = input.clientIp?.trim();
  const userId = input.userId?.trim();

  if (userId) {
    const recentU = prune(userBookingTimestamps, userId, now);
    if (recentU.length >= MAX_BOOKINGS_PER_USER_PER_WINDOW) {
      warnBlock(input, "user_booking_velocity");
      throw new Error("Too many booking attempts for this account. Try again later or contact support.");
    }
  }

  if (ip && ip !== "unknown") {
    const recent = prune(ipBookingTimestamps, ip, now);
    if (recent.length >= MAX_BOOKINGS_PER_IP_PER_WINDOW) {
      warnBlock(input, "ip_booking_velocity");
      throw new Error("Too many booking attempts from this network. Try again later or contact support.");
    }
    recent.push(now);
    ipBookingTimestamps.set(ip, recent);
  }

  if (userId) {
    const r = userBookingTimestamps.get(userId) ?? [];
    r.push(now);
    userBookingTimestamps.set(userId, r);
  }

  const base = Math.max(1, input.baseStayCents);
  const ratio = input.subtotalCents / base;
  if (ratio < MIN_SUBTOTAL_VS_BASE_RATIO || ratio > MAX_SUBTOTAL_VS_BASE_RATIO) {
    warnBlock(input, "subtotal_base_ratio");
    throw new Error("Pricing for this stay could not be validated. Refresh and try again.");
  }
}
