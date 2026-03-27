import { evaluatePremiumPlacementPolicy } from "@/lib/trustgraph/infrastructure/services/premiumPlacementPolicyService";

export async function getPremiumPlacementPolicyForListing(listingId: string) {
  return evaluatePremiumPlacementPolicy(listingId);
}
