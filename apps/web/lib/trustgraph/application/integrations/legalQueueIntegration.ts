import { getPhase7EnterpriseConfig } from "@/lib/trustgraph/config/phase7-enterprise";
import { computeAndPersistCaseSlaState } from "@/lib/trustgraph/application/computeSlaState";
import { isTrustGraphLegalSlaEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/feature-flags";

export async function syncCaseSlaForVerificationCase(args: {
  caseId: string;
  workspaceId: string | null;
}) {
  if (!isTrustGraphEnabled() || !isTrustGraphLegalSlaEnabled()) {
    return { skipped: true as const };
  }
  const cfg = getPhase7EnterpriseConfig();
  const dueAt = new Date(Date.now() + cfg.sla.defaultLegalQueueDueHours * 3600000);
  await computeAndPersistCaseSlaState({
    caseId: args.caseId,
    workspaceId: args.workspaceId,
    dueAt,
    cfg,
  });
  return { ok: true as const };
}
