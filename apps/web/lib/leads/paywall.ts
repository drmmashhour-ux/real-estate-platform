/**
 * When enabled, FSBO/CRM public listing pages hide representative contact until the buyer
 * completes Stripe checkout (`listing_contact_lead`). Server-side only — set in deployment env.
 */
export function isListingContactPaywallEnabled(): boolean {
  const v = process.env.LISTING_CONTACT_PAYWALL_ENABLED?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}
