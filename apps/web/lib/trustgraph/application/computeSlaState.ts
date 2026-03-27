import { prisma } from "@/lib/db";
import type { Phase7EnterpriseConfig } from "@/lib/trustgraph/config/phase7-enterprise";
import { ensureDefaultLegalQueuePolicy } from "@/lib/trustgraph/infrastructure/services/slaPolicyService";
import type { SlaStateKind } from "@/lib/trustgraph/domain/sla";

export function computeSlaStateKind(dueAt: Date, now: Date, cfg: Phase7EnterpriseConfig): SlaStateKind {
  const ms = dueAt.getTime() - now.getTime();
  const hours = ms / (3600 * 1000);
  if (hours < 0) return "overdue";
  if (hours <= cfg.sla.dueSoonHoursBeforeDue) return "due_soon";
  return "on_track";
}

export async function computeAndPersistCaseSlaState(args: {
  caseId: string;
  workspaceId: string | null;
  dueAt: Date;
  cfg: Phase7EnterpriseConfig;
}): Promise<SlaStateKind> {
  const now = new Date();
  const kind = computeSlaStateKind(args.dueAt, now, args.cfg);
  const policyId = await ensureDefaultLegalQueuePolicy(args.workspaceId);

  await prisma.trustgraphCaseSlaState.upsert({
    where: { caseId: args.caseId },
    create: {
      caseId: args.caseId,
      workspaceId: args.workspaceId ?? undefined,
      slaPolicyId: policyId ?? undefined,
      state: kind,
      dueAt: args.dueAt,
    },
    update: {
      state: kind,
      dueAt: args.dueAt,
      workspaceId: args.workspaceId ?? undefined,
    },
  });

  return kind;
}
