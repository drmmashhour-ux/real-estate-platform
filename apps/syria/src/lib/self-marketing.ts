/**
 * Light-weight self-marketing (Hadiah Link) — nudges only; no schedulers, no social APIs.
 *
 * - Share reminder: views 0–4 (strictly below 5) → “share your ad”.
 * - Featured upsell + hot badge: views >= 11 (i.e. more than 10).
 * - Low quality: zero images or fewer than MIN_AMENITIES amenities.
 */
export const SELF_MKT_VIEWS_SHARE_REMINDER_MAX = 4;
/** Integer views above 10 → minimum 11 */
export const SELF_MKT_VIEWS_FEATURED_UPSELL_MIN = 11;
/** Card “hot” badge when views reach the same band as the upsell */
export const SELF_MKT_VIEWS_HOT_BADGE_MIN = 11;
export const SELF_MKT_MIN_AMENITIES_FOR_QUALITY = 2;
