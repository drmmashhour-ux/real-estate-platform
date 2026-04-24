import { prisma } from "@/lib/db";
import { buildScoreContext } from "./deal.service";
import { computeCloseProbability, type CloseProbabilityEngineResult } from "./close-probability.engine";

function gapPct(dealPriceCad: number, listPriceCad: number | null): number | null {
  if (listPriceCad == null || listPriceCad <= 0) return null;
  return (Math.abs(dealPriceCad - listPriceCad) / listPriceCad) * 100;
}

function daysBetween(a: Date, b: Date): number {
  return Math.max(0, (b.getTime() - a.getTime()) / 86_400_000);
}

export type CloseProbabilityPersisted = CloseProbabilityEngineResult & {
  id: string;
  createdAt: Date;
};

export async function buildCloseProbabilityContext(dealId: string) {
  const scoreCtx = await buildScoreContext(dealId);
  if (!scoreCtx) return null;

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      status: true,
      crmStage: true,
      createdAt: true,
    },
  });
  if (!deal) return null;

  const now = new Date();
  const [approvalCount, closingDocs, checklistRows, conditions, closing] = await Promise.all([
    prisma.dealExecutionApproval.count({ where: { dealId } }),
    prisma.dealClosingDocument.findMany({
      where: { dealId },
      select: { status: true, required: true },
    }),
    prisma.dealClosingChecklist.findMany({
      where: { dealId },
      select: { status: true },
    }),
    prisma.dealClosingCondition.findMany({
      where: { dealId },
      select: { status: true, deadline: true },
    }),
    prisma.dealClosing.findUnique({
      where: { dealId },
      select: { closingDate: true },
    }),
  ]);

  let verified = 0;
  let uploaded = 0;
  let missing = 0;
  let rejected = 0;
  const requiredRows = closingDocs.filter((d) => d.required);
  const iter = requiredRows.length > 0 ? requiredRows : closingDocs;
  for (const d of iter) {
    switch (d.status) {
      case "VERIFIED":
        verified += 1;
        break;
      case "UPLOADED":
        uploaded += 1;
        break;
      case "REJECTED":
        rejected += 1;
        break;
      default:
        missing += 1;
        break;
    }
  }

  const requiredCount = iter.length;
  let complete = 0;
  let blocked = 0;
  for (const c of checklistRows) {
    if (c.status === "COMPLETE") complete += 1;
    if (c.status === "BLOCKED") blocked += 1;
  }

  let pendingConditions = 0;
  let overdueConditions = 0;
  for (const c of conditions) {
    const st = (c.status ?? "").toLowerCase();
    if (st === "fulfilled" || st === "waived" || st === "released") continue;
    pendingConditions += 1;
    if (c.deadline && c.deadline < now) overdueConditions += 1;
  }

  const { inputs, documentsCount } = scoreCtx;
  const listPriceGapPct = gapPct(inputs.dealPriceCad, inputs.listPriceCad);
  const daysSinceLastActivity = daysBetween(inputs.lastActivityAt, inputs.now);

  return {
    status: deal.status,
    crmStage: deal.crmStage,
    dealCreatedAt: deal.createdAt,
    now,
    scoreInputs: inputs,
    listPriceGapPct,
    daysSinceLastActivity,
    hasBrokerExecutionApproval: approvalCount > 0,
    closingDocuments: {
      required: requiredCount,
      verified,
      uploaded,
      missing,
      rejected,
    },
    checklist: {
      total: checklistRows.length,
      complete,
      blocked,
    },
    closingConditions: {
      pending: pendingConditions,
      overdue: overdueConditions,
    },
    targetClosingDate: closing?.closingDate ?? null,
    dealDocumentsCount: documentsCount,
  };
}

export async function createCloseProbabilityPrediction(dealId: string): Promise<CloseProbabilityPersisted | null> {
  const ctx = await buildCloseProbabilityContext(dealId);
  if (!ctx) return null;

  const engine = computeCloseProbability(ctx);

  const row = await prisma.closeProbability.create({
    data: {
      dealId,
      probability: engine.probability,
      category: engine.category,
      factorsJson: {
        version: 1,
        factors: engine.factors,
        drivers: engine.drivers,
        risks: engine.risks,
      },
    },
  });

  await prisma.deal
    .update({
      where: { id: dealId },
      data: { closeProbability: engine.probability / 100 },
    })
    .catch(() => undefined);

  return {
    ...engine,
    id: row.id,
    createdAt: row.createdAt,
  };
}

export async function getLatestCloseProbability(dealId: string): Promise<CloseProbabilityPersisted | null> {
  const row = await prisma.closeProbability.findFirst({
    where: { dealId },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return null;
  const j = row.factorsJson as {
    factors?: CloseProbabilityEngineResult["factors"];
    drivers?: string[];
    risks?: string[];
  };
  return {
    id: row.id,
    createdAt: row.createdAt,
    probability: row.probability,
    category: row.category as CloseProbabilityPersisted["category"],
    factors: j.factors ?? ({} as CloseProbabilityEngineResult["factors"]),
    drivers: j.drivers ?? [],
    risks: j.risks ?? [],
  };
}
