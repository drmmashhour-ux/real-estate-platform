import { computePremiumEligibilityForListing } from "@/lib/trustgraph/infrastructure/services/premiumEligibilityService";

export async function getPremiumEligibilityForListing(listingId: string) {
  return computePremiumEligibilityForListing(listingId);
}
