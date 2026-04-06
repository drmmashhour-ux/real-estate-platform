import type { BuyerListingPayload } from "@/components/listings/BuyerListingDetail";

const REDACT_EMAIL = "unlock@platform.local";
const REDACT_PHONE = null;

/**
 * Strips identifiable representative contact from a public listing payload (server-side).
 */
export function redactBuyerListingContactPayload(listing: BuyerListingPayload): BuyerListingPayload {
  const representative = listing.representative
    ? {
        ...listing.representative,
        email: REDACT_EMAIL,
        phone: REDACT_PHONE,
      }
    : listing.representative;

  return {
    ...listing,
    contactEmail: REDACT_EMAIL,
    contactPhone: REDACT_PHONE,
    representative,
  };
}
