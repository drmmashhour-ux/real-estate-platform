import { isTrustGraphEnabled } from "@/lib/trustgraph/config";
import { isTrustGraphBnhubRiskEnabled } from "@/lib/trustgraph/feature-flags";
import { runHostVerification } from "@/lib/trustgraph/application/runHostVerification";

export async function syncTrustGraphOnHostApproved(args: { hostId: string }) {
  if (!isTrustGraphEnabled() || !isTrustGraphBnhubRiskEnabled()) {
    return { skipped: true as const };
  }
  await runHostVerification({ hostId: args.hostId, actorUserId: null });
  return { skipped: false as const };
}
