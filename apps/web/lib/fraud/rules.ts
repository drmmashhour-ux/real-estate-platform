/**
 * Deterministic rule weights and thresholds (tunable; feedback loop via FraudDecision).
 */

export const SIGNAL_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/** Prefix for user-entity rows tied to IP only (no User.id yet). */
export const USER_ENTITY_IP_PREFIX = "ip:";

export function userEntityIdFromIpFingerprint(ipFingerprint: string): string {
  return `${USER_ENTITY_IP_PREFIX}${ipFingerprint}`;
}

export const POINTS = {
  failed_login_burst: 12,
  rapid_signup_same_ip: 18,
  messaging_contact_spam: 15,
  listing_price_bait: 22,
  listing_volume_spam: 20,
  booking_velocity_guest: 18,
  booking_new_account_rush: 25,
  payment_failed: 20,
  stripe_radar_elevated: 28,
  duplicate_image_hash: 15,
} as const;

export const OPEN_CASE_MIN_LEVEL = "high" as const;

/** Bait listing: night price below this (cents) triggers signal (tune per market later). */
export const BAIT_NIGHT_PRICE_CENTS = 1500; // $15

export const MAX_LISTINGS_PER_OWNER_PER_DAY = 8;

export const MAX_BOOKINGS_PER_GUEST_PER_DAY = 6;
