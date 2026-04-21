import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { appendCapitalAudit } from "@/modules/capital/capital-audit";
import { userCanWaiveCriticalFinancingCondition } from "@/modules/capital/capital-access";

const TAG = "[financing-condition]";

export async function createFinancingCondition(options: {
  pipelineDealId: string;
  actorUserId: string;
  title: string;
  description?: string | null;
  category: string;
  priority?: string | null;
  status?: string;
  dueDate?: Date | null;
  ownerUserId?: string | null;
  offerId?: string | null;
  notes?: string | null;
}): Promise<{ id: string }> {
  const row = await prisma.investmentPipelineFinancingCondition.create({
    data: {
      pipelineDealId: options.pipelineDealId,
      offerId: options.offerId ?? null,
      title: options.title,
      description: options.description ?? null,
      category: options.category,
      priority: options.priority ?? null,
      status: options.status ?? "OPEN",
      dueDate: options.dueDate ?? null,
      ownerUserId: options.ownerUserId ?? null,
      notes: options.notes ?? null,
    },
    select: { id: true },
  });

  await appendCapitalAudit({
    pipelineDealId: options.pipelineDealId,
    actorUserId: options.actorUserId,
    eventType: "CONDITION_ADDED",
    note: options.title,
    metadataJson: { conditionId: row.id },
  });

  logInfo(`${TAG}`, { pipelineDealId: options.pipelineDealId, conditionId: row.id });
  return row;
}

export async function updateFinancingCondition(options: {
  pipelineDealId: string;
  conditionId: string;
  actorUserId: string;
  status?: string;
  notes?: string | null;
  ownerUserId?: string | null;
  dueDate?: Date | null;
  waiverNote?: string | null;
  waive?: boolean;
}): Promise<void> {
  const row = await prisma.investmentPipelineFinancingCondition.findFirst({
    where: { id: options.conditionId, pipelineDealId: options.pipelineDealId },
    select: { id: true, priority: true, status: true },
  });
  if (!row) throw new Error("Condition not found");

  let targetStatus = options.status ?? row.status;
  if (options.waive) targetStatus = "WAIVED";

  if (targetStatus === "WAIVED") {
    const allowed = await userCanWaiveCriticalFinancingCondition(options.actorUserId);
    if (!allowed) throw new Error("Permission denied: cannot waive financing conditions.");
    if (!options.waiverNote?.trim()) {
      throw new Error("Waiver requires a note and authorized actor.");
    }
  }

  await prisma.investmentPipelineFinancingCondition.update({
    where: { id: row.id },
    data: {
      status: targetStatus,
      notes: options.notes ?? undefined,
      ownerUserId: options.ownerUserId ?? undefined,
      dueDate: options.dueDate ?? undefined,
      waiverNote: options.waiverNote ?? undefined,
      waivedByUserId: targetStatus === "WAIVED" ? options.actorUserId : undefined,
      satisfiedAt: targetStatus === "SATISFIED" ? new Date() : undefined,
      updatedAt: new Date(),
    },
  });

  await appendCapitalAudit({
    pipelineDealId: options.pipelineDealId,
    actorUserId: options.actorUserId,
    eventType: "CONDITION_UPDATED",
    note: `${row.status} → ${targetStatus}`,
    metadataJson: { conditionId: row.id },
  });

  logInfo(`${TAG}`, { pipelineDealId: options.pipelineDealId, conditionId: row.id });
}

/** Standard diligence-style conditions — advisory; teams refine before outreach. */
export async function seedStandardConditionsForOffer(options: {
  pipelineDealId: string;
  offerId: string;
  actorUserId: string;
}): Promise<number> {
  const templates: Array<{
    title: string;
    category: string;
    priority: string | null;
  }> = [
    { title: "Updated financial statements", category: "FINANCIAL", priority: "HIGH" },
    { title: "Appraisal / valuation", category: "APPRAISAL", priority: "CRITICAL" },
    { title: "Insurance binders / proof", category: "INSURANCE", priority: "HIGH" },
    { title: "Environmental / Phase I (if applicable)", category: "TECHNICAL", priority: "MEDIUM" },
    { title: "Entity formation & authority documents", category: "LEGAL", priority: "HIGH" },
    { title: "Proof of equity / sources & uses", category: "FINANCIAL", priority: "CRITICAL" },
    { title: "ESG disclosure pack (where applicable)", category: "ESG", priority: "MEDIUM" },
  ];

  let n = 0;
  for (const t of templates) {
    await prisma.investmentPipelineFinancingCondition.create({
      data: {
        pipelineDealId: options.pipelineDealId,
        offerId: options.offerId,
        title: t.title,
        category: t.category,
        priority: t.priority,
        status: "OPEN",
      },
    });
    n += 1;
  }

  await appendCapitalAudit({
    pipelineDealId: options.pipelineDealId,
    actorUserId: options.actorUserId,
    eventType: "CONDITION_ADDED",
    note: `Seeded standard set for offer ${options.offerId}`,
    metadataJson: { offerId: options.offerId, count: n },
  });

  logInfo(`${TAG}`, { pipelineDealId: options.pipelineDealId, seeded: n });
  return n;
}
