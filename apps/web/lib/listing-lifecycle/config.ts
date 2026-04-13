/**
 * Listing activation + deal celebration can send email, in-app notifications, and mobile push.
 * Set LISTING_LIFECYCLE_EMAILS_ENABLED=false to use messages only (dashboard + Expo push).
 */
export function isListingLifecycleEmailEnabled(): boolean {
  const v = process.env.LISTING_LIFECYCLE_EMAILS_ENABLED?.trim().toLowerCase();
  if (v === "false" || v === "0" || v === "no") return false;
  return true;
}
