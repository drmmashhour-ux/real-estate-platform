/**
 * SYBNB-12 Launch control — behavior driven by ENV (restart / runtime env refresh picks up changes; no redeploy of code).
 * @see `.env.production.example` entries `SYBNB_MODE`, `SYBNB_ALLOW_UNVERIFIED`, `SYBNB_SHOW_PHONE`.
 */

export type SybnbModeSetting = "soft_launch" | "open";

/** `SYBNB_MODE`: default `open` preserves existing behavior unless set to `soft_launch`. */
export const SYBNB_MODE: SybnbModeSetting =
  process.env.SYBNB_MODE?.trim().toLowerCase() === "soft_launch" ? "soft_launch" : "open";

/** Default `true` — set `SYBNB_ALLOW_UNVERIFIED=false` to block unverified sellers from publishing **stay** listings. */
export const SYBNB_ALLOW_UNVERIFIED = process.env.SYBNB_ALLOW_UNVERIFIED !== "false";

/** Default `true` — set `SYBNB_SHOW_PHONE=false` to hide WhatsApp/tel on **stay** listings and funnel guests to booking request. */
export const SYBNB_SHOW_PHONE = process.env.SYBNB_SHOW_PHONE !== "false";

export function isSybnbSoftLaunch(): boolean {
  return SYBNB_MODE === "soft_launch";
}

/** Soft launch: elevate owner contact versus in-app booking request when both are available. */
export function sybnbPrioritizeContactOverBooking(): boolean {
  return isSybnbSoftLaunch();
}

/** Show stronger urgency cues on `/sybnb` when in soft launch. */
export function sybnbSoftLaunchUrgencyMessaging(): boolean {
  return isSybnbSoftLaunch();
}

/**
 * Payments (card PSP) blocked for product/marketing phase — independent of raw `SYBNB_PAYMENTS_ENABLED`.
 * Guards Stripe UI and precondition checks alongside `sybnb.config` payment flags.
 */
export function sybnbPaymentsHeldForSoftLaunch(): boolean {
  return isSybnbSoftLaunch();
}
