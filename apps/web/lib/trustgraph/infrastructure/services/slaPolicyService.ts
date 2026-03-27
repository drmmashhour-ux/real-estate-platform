import { prisma } from "@/lib/db";
import { getPhase7EnterpriseConfig } from "@/lib/trustgraph/config/phase7-enterprise";
import { isTrustGraphLegalSlaEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/feature-flags";

export async function ensureDefaultLegalQueuePolicy(workspaceId: string | null): Promise<string | null> {
  if (!isTrustGraphEnabled() || !isTrustGraphLegalSlaEnabled()) return null;

  const cfg = getPhase7EnterpriseConfig();
  const existing = await prisma.trustgraphSlaPolicy.findFirst({
    where: workspaceId ? { workspaceId, queueKey: "legal_review" } : { workspaceId: null, queueKey: "legal_review" },
  });
  if (existing) return existing.id;

  const created = await prisma.trustgraphSlaPolicy.create({
    data: {
      workspaceId: workspaceId ?? undefined,
      name: "Default legal review",
      queueKey: "legal_review",
      dueHours: cfg.sla.defaultLegalQueueDueHours,
      escalatesAfterHours: cfg.sla.defaultEscalationAfterHours,
    },
    select: { id: true },
  });
  return created.id;
}
