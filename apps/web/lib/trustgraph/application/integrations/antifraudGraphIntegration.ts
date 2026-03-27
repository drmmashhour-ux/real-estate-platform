import { recomputeFraudGraphForListing } from "@/lib/trustgraph/infrastructure/services/antifraudGraphService";
import { isTrustGraphAntifraudGraphEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/feature-flags";

export async function syncAntifraudGraphAfterListingPipeline(listingId: string) {
  if (!isTrustGraphEnabled() || !isTrustGraphAntifraudGraphEnabled()) {
    return { skipped: true as const };
  }
  return recomputeFraudGraphForListing(listingId);
}
