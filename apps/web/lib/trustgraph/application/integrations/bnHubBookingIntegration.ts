import { isTrustGraphEnabled } from "@/lib/trustgraph/config";
import { isTrustGraphBnhubRiskEnabled } from "@/lib/trustgraph/feature-flags";
import { runBookingRiskEvaluation } from "@/lib/trustgraph/application/runBookingRiskEvaluation";

export async function syncTrustGraphOnBookingCreated(args: { bookingId: string }) {
  if (!isTrustGraphEnabled() || !isTrustGraphBnhubRiskEnabled()) {
    return { skipped: true as const };
  }
  await runBookingRiskEvaluation({ bookingId: args.bookingId, actorUserId: null });
  return { skipped: false as const };
}
