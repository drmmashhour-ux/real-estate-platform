import { syncMediaClassificationSummaryForListing } from "@/lib/trustgraph/application/integrations/mediaClassificationIntegration";

export async function runMediaClassificationForListing(listingId: string) {
  return syncMediaClassificationSummaryForListing(listingId);
}
