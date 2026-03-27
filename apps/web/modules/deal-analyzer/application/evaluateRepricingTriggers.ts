import { isDealAnalyzerRepricingTriggersEnabled } from "@/modules/deal-analyzer/config";
import { evaluateRepricingTriggersForListing } from "@/modules/deal-analyzer/infrastructure/services/repricingTriggerService";

export async function evaluateRepricingTriggers(listingId: string) {
  if (!isDealAnalyzerRepricingTriggersEnabled()) {
    return { ok: false as const, error: "Repricing triggers disabled" };
  }
  return evaluateRepricingTriggersForListing(listingId);
}
