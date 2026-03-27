import { isTrustGraphEnabled } from "@/lib/trustgraph/config";
import { isTrustGraphMortgageAutopilotEnabled } from "@/lib/trustgraph/feature-flags";
import { runMortgageReadinessVerification } from "@/lib/trustgraph/application/runMortgageReadinessVerification";

export async function syncMortgageReadinessOnRequestSaved(args: {
  mortgageRequestId: string;
  actorUserId?: string | null;
}) {
  if (!isTrustGraphEnabled() || !isTrustGraphMortgageAutopilotEnabled()) {
    return { skipped: true as const };
  }
  await runMortgageReadinessVerification({
    mortgageRequestId: args.mortgageRequestId,
    actorUserId: args.actorUserId ?? null,
  });
  return { skipped: false as const };
}
