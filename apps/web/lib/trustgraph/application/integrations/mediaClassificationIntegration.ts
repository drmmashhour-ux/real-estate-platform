import { summarizeMediaClassificationForListing } from "@/lib/trustgraph/infrastructure/services/mediaVerificationEvidenceService";
import { isTrustGraphEnabled, isTrustGraphMediaClassificationEnabled } from "@/lib/trustgraph/feature-flags";

export async function syncMediaClassificationSummaryForListing(listingId: string) {
  if (!isTrustGraphEnabled() || !isTrustGraphMediaClassificationEnabled()) {
    return { skipped: true as const };
  }
  const summary = await summarizeMediaClassificationForListing(listingId);
  return { skipped: false as const, summary };
}
