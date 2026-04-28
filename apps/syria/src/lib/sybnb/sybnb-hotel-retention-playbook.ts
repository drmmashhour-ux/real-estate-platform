/**
 * ORDER SYBNB-71 — Hotel retention: cadence, Arabic WhatsApp templates, upgrade framing (manual ops first).
 * Signals for “has leads” are documented on the admin page (`hotel_contact_click`, CRM touches); automation optional later.
 */

/** Recommended spacing between proactive hotel checks (calendar days — ops picks slot inside window). */
export const SYBNB71_HOTEL_RETENTION_MIN_DAY_GAP = 3;
export const SYBNB71_HOTEL_RETENTION_MAX_DAY_GAP = 5;

/** Periodic wellness check — keep hotels answering + surfaced problems fast. */
export const SYBNB71_HOTEL_CHECKIN_MESSAGE_AR = `كيف النتائج؟ هل وصلك طلبات؟`;

/** When the hotel already receives taps/leads — propose visibility upgrade (paired with relationship warmth). */
export const SYBNB71_HOTEL_UPSELL_LEADS_MESSAGE_AR = `فيك تزيد الظهور للحصول على زبائن أكثر 👍`;
