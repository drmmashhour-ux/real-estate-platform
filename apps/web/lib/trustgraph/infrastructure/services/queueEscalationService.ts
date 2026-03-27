import { prisma } from "@/lib/db";
import { recordPlatformEvent } from "@/lib/observability";
import { getPhase7EnterpriseConfig } from "@/lib/trustgraph/config/phase7-enterprise";
import { isTrustGraphLegalSlaEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/feature-flags";

export async function escalateOverdueCaseRecords(workspaceId: string): Promise<{ escalated: number }> {
  if (!isTrustGraphEnabled() || !isTrustGraphLegalSlaEnabled()) {
    return { escalated: 0 };
  }

  const cfg = getPhase7EnterpriseConfig();
  const now = new Date();
  const rows = await prisma.trustgraphCaseSlaState.findMany({
    where: { workspaceId },
  });

  let escalated = 0;
  for (const row of rows) {
    if (!row.dueAt || row.pausedReason) continue;
    if (row.state === "escalated") continue;
    const hoursPastDue = (now.getTime() - row.dueAt.getTime()) / 3600000;
    if (hoursPastDue <= 0) continue;
    if (hoursPastDue < cfg.sla.defaultEscalationAfterHours - cfg.sla.defaultLegalQueueDueHours) continue;

    await prisma.trustgraphCaseSlaState.update({
      where: { id: row.id },
      data: { state: "escalated", metadata: { reason: "sla_breach" } as object },
    });
    await prisma.trustgraphSlaEvent.create({
      data: {
        caseId: row.caseId,
        eventType: "escalation",
        payload: { workspaceId: row.workspaceId } as object,
      },
    });
    void recordPlatformEvent({
      eventType: "trustgraph_sla_escalation",
      sourceModule: "trustgraph",
      entityType: "VERIFICATION_CASE",
      entityId: row.caseId,
      payload: { workspaceId: row.workspaceId },
    }).catch(() => {});
    escalated += 1;
  }

  return { escalated };
}
