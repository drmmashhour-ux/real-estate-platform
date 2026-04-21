import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { appendCapitalAudit } from "@/modules/capital/capital-audit";

const TAG = "[covenant]";

export async function createCovenant(options: {
  pipelineDealId: string;
  actorUserId: string;
  title: string;
  summary: string;
  covenantType: string;
  offerId?: string | null;
  frequency?: string | null;
  status?: string;
  notes?: string | null;
}): Promise<{ id: string }> {
  const row = await prisma.investmentPipelineCovenant.create({
    data: {
      pipelineDealId: options.pipelineDealId,
      offerId: options.offerId ?? null,
      title: options.title,
      summary: options.summary,
      covenantType: options.covenantType,
      frequency: options.frequency ?? null,
      status: options.status ?? "ACTIVE",
      notes: options.notes ?? null,
    },
    select: { id: true },
  });

  await appendCapitalAudit({
    pipelineDealId: options.pipelineDealId,
    actorUserId: options.actorUserId,
    eventType: "COVENANT_ADDED",
    note: options.title,
    metadataJson: { covenantId: row.id },
  });

  logInfo(`${TAG}`, { pipelineDealId: options.pipelineDealId, covenantId: row.id });
  return row;
}

export async function updateCovenantStatus(options: {
  pipelineDealId: string;
  covenantId: string;
  actorUserId: string;
  status: string;
  notes?: string | null;
}): Promise<void> {
  const row = await prisma.investmentPipelineCovenant.findFirst({
    where: { id: options.covenantId, pipelineDealId: options.pipelineDealId },
    select: { id: true, status: true },
  });
  if (!row) throw new Error("Covenant not found");

  await prisma.investmentPipelineCovenant.update({
    where: { id: row.id },
    data: {
      status: options.status,
      notes: options.notes ?? undefined,
      updatedAt: new Date(),
    },
  });

  await appendCapitalAudit({
    pipelineDealId: options.pipelineDealId,
    actorUserId: options.actorUserId,
    eventType: "COVENANT_UPDATED",
    note: `${row.status} → ${options.status}`,
    metadataJson: { covenantId: row.id },
  });

  logInfo(`${TAG}`, { pipelineDealId: options.pipelineDealId, covenantId: row.id });
}

export async function listCovenants(pipelineDealId: string) {
  return prisma.investmentPipelineCovenant.findMany({
    where: { pipelineDealId },
    orderBy: { updatedAt: "desc" },
  });
}
