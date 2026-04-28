/**
 * ORDER SYBNB-70 — Manual follow-up template + inquiry queue for ops (WhatsApp-first).
 * Automation is intentionally out of scope; template text lives here as single source of truth.
 */

/** Arabic DM suggested **12–24h** after interest without booking — operators personalize before sending. */
export const SYBNB70_MANUAL_FOLLOW_UP_MESSAGE_AR = `مرحبا 👋
هل ما زلت مهتم بالإقامة؟ في خيارات متوفرة 👍`;

/** Recommended outreach window start/end relative to inquiry creation (hours). */
export const SYBNB70_FOLLOW_UP_MIN_AGE_H = 12;
export const SYBNB70_FOLLOW_UP_MAX_AGE_H = 24;
