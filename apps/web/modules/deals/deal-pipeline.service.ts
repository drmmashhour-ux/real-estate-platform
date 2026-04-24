import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import type { PipelineStage } from "@/modules/deals/deal.types";
import { assertStageTransitionAllowed, logStageCheck } from "@/modules/deals/deal-stage-engine";
import { buildGateContext } from "@/modules/deals/deal-workflow-orchestrator";
import { seedConditionsFromListing } from "@/modules/deals/deal-conditions.service";
import { recordEvolutionOutcome } from "@/modules/evolution/outcome-tracker.service";
import { runAndAttachUnderwritingToDeal } from "@/modules/investment-ai/deal-underwriting.integration.service";

const TAG = "[deal-pipeline]";

async function appendAudit(options: {
  dealId: string;
  actorUserId?: string | null;
  eventType: string;
  note?: string | null;
  metadataJson?: Record<string, unknown>;
}) {
  await prisma.investmentPipelineDecisionAudit.create({
    data: {
      dealId: options.dealId,
      actorUserId: options.actorUserId ?? null,
      eventType: options.eventType,
      note: options.note ?? null,
      metadataJson: options.metadataJson ?? {},
    },
  });
}

export async function createPipelineDeal(options: {
  title: string;
  listingId?: string | null;
  ownerUserId: string;
  sponsorUserId?: string | null;
  priority?: string | null;
}): Promise<{ id: string }> {
  const latestMemo =
    options.listingId ?
      await prisma.investorMemo.findFirst({
        where: { listingId: options.listingId, status: "GENERATED" },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      })
    : null;
  const latestIc =
    options.listingId ?
      await prisma.investorIcPack.findFirst({
        where: { listingId: options.listingId, status: "GENERATED" },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      })
    : null;

  const row = await prisma.investmentPipelineDeal.create({
    data: {
      title: options.title.slice(0, 512),
      listingId: options.listingId ?? null,
      ownerUserId: options.ownerUserId,
      sponsorUserId: options.sponsorUserId ?? null,
      priority: options.priority ?? "MEDIUM",
      pipelineStage: "SOURCED",
      status: "ACTIVE",
      decisionStatus: "PENDING",
      latestMemoId: latestMemo?.id ?? null,
      latestIcPackId: latestIc?.id ?? null,
    },
    select: { id: true },
  });

  await prisma.investmentPipelineDealStageHistory.create({
    data: {
      dealId: row.id,
      fromStage: null,
      toStage: "SOURCED",
      changedByUserId: options.ownerUserId,
      reason: "Deal created",
    },
  });

  await appendAudit({
    dealId: row.id,
    actorUserId: options.ownerUserId,
    eventType: "CREATED",
    note: options.title.slice(0, 500),
    metadataJson: { listingId: options.listingId ?? null },
  });

  if (options.listingId) {
    await seedConditionsFromListing(row.id, options.listingId).catch(() => 0);
  }

  void runAndAttachUnderwritingToDeal(row.id, { source: "INITIAL" }).catch(() => {});

  logInfo(`${TAG} created`, { dealId: row.id, listingId: options.listingId });
  return row;
}

export async function applyPipelineStage(options: {
  dealId: string;
  toStage: PipelineStage;
  actorUserId: string;
  reason?: string | null;
}): Promise<void> {
  const deal = await prisma.investmentPipelineDeal.findUnique({
    where: { id: options.dealId },
    select: { pipelineStage: true },
  });
  if (!deal) throw new Error("Deal not found");

  const gate = await buildGateContext(options.dealId);
  const check = assertStageTransitionAllowed(deal.pipelineStage as PipelineStage, options.toStage, gate);
  logStageCheck(options.dealId, deal.pipelineStage as PipelineStage, options.toStage, check);
  if (!check.ok) throw new Error(check.reason ?? "Stage transition blocked");

  await prisma.investmentPipelineDeal.update({
    where: { id: options.dealId },
    data: {
      pipelineStage: options.toStage,
      status:
        options.toStage === "DECLINED" ? "DECLINED"
        : options.toStage === "ON_HOLD" ? "ON_HOLD"
        : options.toStage === "CLOSED" ? "CLOSED"
        : options.toStage === "APPROVED" ? "APPROVED"
        : undefined,
      closedAt:
        options.toStage === "CLOSED" || options.toStage === "DECLINED" ? new Date()
        : undefined,
      updatedAt: new Date(),
    },
  });

  await prisma.investmentPipelineDealStageHistory.create({
    data: {
      dealId: options.dealId,
      fromStage: deal.pipelineStage,
      toStage: options.toStage,
      changedByUserId: options.actorUserId,
      reason: options.reason ?? null,
    },
  });

  await appendAudit({
    dealId: options.dealId,
    actorUserId: options.actorUserId,
    eventType: "STAGE_CHANGED",
    note: `${deal.pipelineStage} → ${options.toStage}`,
    metadataJson: { reason: options.reason ?? null },
  });

  try {
    const { onPipelineStageChanged } = await import("@/modules/capital/capital-monitoring.service");
    await onPipelineStageChanged(options.dealId, options.toStage);
  } catch {
    /* capital module optional at build boundary */
  }

  if (options.toStage === "CLOSED" || options.toStage === "DECLINED") {
    void recordEvolutionOutcome({
      domain: "DEAL",
      metricType: "CONVERSION",
      strategyKey: "deal_execution",
      entityId: options.dealId,
      entityType: "InvestmentPipelineDeal",
      actualJson: {
        result: options.toStage === "CLOSED" ? "CLOSED" : "LOST",
        stage: options.toStage,
        reason: options.reason,
      },
      reinforceStrategy: true,
      idempotent: true,
    }).catch(() => {});
  }

  logInfo(`${TAG} stage`, { dealId: options.dealId, to: options.toStage });
}

export async function getPipelineDealDetail(dealId: string) {
  return prisma.investmentPipelineDeal.findUnique({
    where: { id: dealId },
    include: {
      listing: { select: { id: true, title: true, listingCode: true, price: true } },
      ownerUser: { select: { id: true, name: true, email: true } },
      sponsorUser: { select: { id: true, name: true, email: true } },
      latestMemo: { select: { id: true, title: true, createdAt: true } },
      latestIcPack: { select: { id: true, title: true, createdAt: true } },
      stageHistories: { orderBy: { createdAt: "desc" }, take: 40 },
      committeeSubmissions: { orderBy: { createdAt: "desc" }, take: 10 },
      committeeDecisions: { orderBy: { createdAt: "desc" }, take: 10 },
      conditions: { orderBy: { updatedAt: "desc" } },
      diligenceTasks: { orderBy: { updatedAt: "desc" } },
      followUps: { orderBy: { updatedAt: "desc" } },
      audits: { orderBy: { createdAt: "desc" }, take: 80 },
      underwritingSnapshots: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
}

export type PipelineDealDetail = NonNullable<Awaited<ReturnType<typeof getPipelineDealDetail>>>;

export async function listPipelineDealsForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  const where =
    user?.role === "ADMIN" ?
      {}
    : {
        OR: [
          { ownerUserId: userId },
          { sponsorUserId: userId },
          { listing: { ownerId: userId } },
          { listing: { brokerAccesses: { some: { brokerId: userId } } } },
        ],
      };

  return prisma.investmentPipelineDeal.findMany({
    where,
    include: {
      listing: { select: { id: true, title: true, listingCode: true } },
      ownerUser: { select: { name: true, email: true } },
      conditions: {
        where: { status: { in: ["OPEN", "IN_PROGRESS"] }, priority: "CRITICAL" },
        select: { id: true },
      },
      followUps: {
        where: { status: "OPEN" },
        orderBy: { dueDate: "asc" },
        take: 1,
        select: { dueDate: true, title: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
}
