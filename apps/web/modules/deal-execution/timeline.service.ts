import { prisma } from "@/lib/db";
import { normalizeState } from "@/modules/execution/execution-state-machine";

export type TimelineEvent = {
  id: string;
  at: string;
  kind: string;
  title: string;
  detail?: string;
};

export async function buildDealTimeline(dealId: string): Promise<TimelineEvent[]> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { id: true, createdAt: true, lecipmExecutionPipelineState: true },
  });
  if (!deal) return [];

  const [approvals, signatures, conditions, audits] = await Promise.all([
    prisma.dealExecutionApproval.findMany({
      where: { dealId },
      orderBy: { approvedAt: "asc" },
      select: { id: true, approvedAt: true },
    }),
    prisma.signatureSession.findMany({
      where: { dealId },
      orderBy: { createdAt: "asc" },
      select: { id: true, createdAt: true, status: true, provider: true },
    }),
    prisma.dealClosingCondition.findMany({
      where: { dealId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.dealExecutionAuditLog.findMany({
      where: { dealId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, createdAt: true, actionKey: true, payload: true },
    }),
  ]);

  const events: TimelineEvent[] = [];

  events.push({
    id: `deal-${deal.id}`,
    at: deal.createdAt.toISOString(),
    kind: "deal_created",
    title: "Deal created",
  });

  events.push({
    id: `pipeline-${deal.id}`,
    at: deal.createdAt.toISOString(),
    kind: "pipeline_state",
    title: `Pipeline: ${normalizeState(deal.lecipmExecutionPipelineState)}`,
    detail: "Platform coordination state — not OACIQ legal status.",
  });

  for (const a of approvals) {
    events.push({
      id: `approval-${a.id}`,
      at: a.approvedAt.toISOString(),
      kind: "broker_approval",
      title: "Broker execution approval recorded",
    });
  }

  for (const s of signatures) {
    events.push({
      id: `sig-${s.id}`,
      at: s.createdAt.toISOString(),
      kind: "signature_session",
      title: `Signature session (${s.provider})`,
      detail: s.status,
    });
  }

  for (const c of conditions) {
    events.push({
      id: `cond-${c.id}`,
      at: c.createdAt.toISOString(),
      kind: "condition",
      title: `Condition: ${c.conditionType}`,
      detail: c.status,
    });
  }

  for (const log of audits) {
    events.push({
      id: `audit-${log.id}`,
      at: log.createdAt.toISOString(),
      kind: "audit",
      title: log.actionKey,
    });
  }

  events.sort((a, b) => a.at.localeCompare(b.at));
  return events;
}
