import { getExternalListingTrustSanitized } from "@/lib/trustgraph/infrastructure/services/externalApiService";

export async function getExternalListingTrust(listingId: string) {
  return getExternalListingTrustSanitized(listingId);
}
