import { prisma } from "@/lib/db";
import type { DealTimelineEntry } from "./deal.types";

export async function buildDealExecutionTimeline(dealId: string): Promise<DealTimelineEntry[]> {
  const [milestones, audits, docs] = await Promise.all([
    prisma.dealMilestone.findMany({ where: { dealId }, orderBy: { createdAt: "asc" } }),
    prisma.dealExecutionAuditLog.findMany({ where: { dealId }, orderBy: { createdAt: "desc" }, take: 40 }),
    prisma.dealDocument.findMany({
      where: { dealId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, type: true, workflowStatus: true, createdAt: true },
    }),
  ]);

  const out: DealTimelineEntry[] = [];

  for (const m of milestones) {
    out.push({
      id: m.id,
      at: m.createdAt.toISOString(),
      kind: "milestone",
      title: m.name,
      detail: m.status,
    });
  }
  for (const d of docs) {
    out.push({
      id: d.id,
      at: d.createdAt.toISOString(),
      kind: "document",
      title: d.type,
      detail: d.workflowStatus ?? undefined,
    });
  }
  for (const a of audits) {
    out.push({
      id: a.id,
      at: a.createdAt.toISOString(),
      kind: "audit",
      title: a.actionKey,
      detail: undefined,
    });
  }

  return out.sort((x, y) => (x.at < y.at ? 1 : -1));
}
