import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import type { DiligenceCategory, DiligenceStatus } from "@/modules/deals/deal.types";

const TAG = "[deal-diligence]";

export async function createDiligenceTask(options: {
  dealId: string;
  title: string;
  description?: string | null;
  category: DiligenceCategory;
  priority?: string | null;
  ownerUserId?: string | null;
  dueDate?: Date | null;
  linkedConditionId?: string | null;
}): Promise<{ id: string }> {
  const row = await prisma.investmentPipelineDiligenceTask.create({
    data: {
      dealId: options.dealId,
      title: options.title.slice(0, 512),
      description: options.description ?? null,
      category: options.category,
      priority: options.priority ?? "MEDIUM",
      status: "OPEN",
      ownerUserId: options.ownerUserId ?? null,
      dueDate: options.dueDate ?? null,
      linkedConditionId: options.linkedConditionId ?? null,
    },
    select: { id: true },
  });

  await prisma.investmentPipelineDecisionAudit.create({
    data: {
      dealId: options.dealId,
      eventType: "DILIGENCE_TASK_ADDED",
      note: `Diligence task: ${options.title.slice(0, 400)}`,
      metadataJson: { diligenceTaskId: row.id },
    },
  });

  logInfo(`${TAG} created`, { dealId: options.dealId, taskId: row.id });
  return row;
}

export async function seedDiligenceFromIcPackQuestions(dealId: string, listingId: string): Promise<number> {
  const pack = await prisma.investorIcPack.findFirst({
    where: { listingId, status: "GENERATED" },
    orderBy: { createdAt: "desc" },
    select: { payloadJson: true },
  });
  const payload = pack?.payloadJson as { appendices?: { methodologyNotes?: string[] } } | undefined;
  const methodology = payload?.appendices?.methodologyNotes ?? [];
  let n = 0;
  const due = new Date();
  due.setDate(due.getDate() + 21);

  if (methodology.length > 0) {
    await createDiligenceTask({
      dealId,
      title: "Resolve methodology / evidence gaps noted in IC pack appendix",
      description: methodology.slice(0, 3).join("\n"),
      category: "ESG",
      priority: "HIGH",
      dueDate: due,
    });
    n += 1;
  }

  return n;
}

export async function setDiligenceTaskStatus(options: {
  dealId: string;
  taskId: string;
  status: DiligenceStatus;
  actorUserId?: string | null;
}): Promise<void> {
  const task = await prisma.investmentPipelineDiligenceTask.findFirst({
    where: { id: options.taskId, dealId: options.dealId },
  });
  if (!task) throw new Error("Task not found");

  await prisma.investmentPipelineDiligenceTask.update({
    where: { id: options.taskId },
    data: {
      status: options.status,
      completedAt: options.status === "COMPLETED" ? new Date() : null,
      updatedAt: new Date(),
    },
  });

  await prisma.investmentPipelineDecisionAudit.create({
    data: {
      dealId: options.dealId,
      actorUserId: options.actorUserId ?? null,
      eventType: "TASK_COMPLETED",
      note: `Diligence ${options.taskId} → ${options.status}`,
      metadataJson: {},
    },
  });

  logInfo(`${TAG} status`, { dealId: options.dealId, taskId: options.taskId, status: options.status });
}
