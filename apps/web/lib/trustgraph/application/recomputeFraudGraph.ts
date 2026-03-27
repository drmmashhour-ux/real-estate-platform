import { recomputeFraudGraphForListing } from "@/lib/trustgraph/infrastructure/services/antifraudGraphService";

export async function recomputeFraudGraph(args: { listingId: string }) {
  return recomputeFraudGraphForListing(args.listingId);
}
