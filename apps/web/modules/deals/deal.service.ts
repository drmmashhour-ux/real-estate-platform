import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { getTransactionById } from "@/modules/transactions/transaction.service";
import { appendDealAuditEvent } from "./deal-audit.service";
import { allocateNextDealSequence, formatDealNumber } from "./deal-number.service";
import { BrokerActionGuard } from "@/lib/compliance/broker-action-guard";
import {
  brokerDecisionAuthorityEnforced,
  recordOaciqBrokerDecision,
} from "@/lib/compliance/oaciq/broker-decision-authority";

const TAG = "[deal.service]";

export async function createStandaloneDeal(input: {
  brokerId: string;
  title: string;
  dealType: string;
  listingId?: string | null;
  ownerUserId?: string | null;
  sponsorUserId?: string | null;
  priority?: string | null;
  actorUserId: string | null;
  /** When broker decision authority enforcement is on, caller records attestation after create. */
  brokerDecisionAttested?: boolean;
  brokerDecisionConfirmedByUserId?: string | null;
}) {
  // PHASE 2 & 4: BROKERAGE ACTION GUARD
  const guard = await BrokerActionGuard.validateBrokerageAction({
    userId: input.brokerId,
    action: "CREATE_LISTING", // Mapped to creation intent
  });
  if (!guard.allowed) {
    throw new Error(guard.reason || "Unauthorized brokerage action.");
  }

  const year = new Date().getFullYear();

  const deal = await prisma.$transaction(async (tx) => {
    const seq = await allocateNextDealSequence(tx, year);
    const dealNumber = formatDealNumber(year, seq);

    const row = await tx.lecipmPipelineDeal.create({
      data: {
        brokerId: input.brokerId,
        listingId: input.listingId ?? undefined,
        dealNumber,
        title: input.title.slice(0, 512),
        dealType: input.dealType.slice(0, 32),
        pipelineStage: "SCREENING",
        decisionStatus: "PENDING",
        priority: input.priority?.slice(0, 16) ?? undefined,
        ownerUserId: input.ownerUserId ?? undefined,
        sponsorUserId: input.sponsorUserId ?? undefined,
      },
    });

    await tx.lecipmPipelineDealStageHistory.create({
      data: {
        dealId: row.id,
        fromStage: null,
        toStage: "SCREENING",
        changedByUserId: input.actorUserId ?? undefined,
        reason: "Deal created",
      },
    });

    await appendDealAuditEvent(tx, {
      dealId: row.id,
      eventType: "DEAL_CREATED",
      actorUserId: input.actorUserId,
      summary: `Deal ${dealNumber} created`,
      metadataJson: { dealNumber },
    });

    return row;
  });

  logInfo(TAG, { action: "createStandalone", id: deal.id });
  return deal;
}

export async function createDealFromTransaction(input: {
  transactionId: string;
  brokerId: string;
  actorUserId: string | null;
  title?: string;
  dealType?: string;
  brokerDecisionAttested?: boolean;
  brokerDecisionConfirmedByUserId?: string | null;
}) {
  // PHASE 2 & 4: BROKERAGE ACTION GUARD
  const guard = await BrokerActionGuard.validateBrokerageAction({
    userId: input.brokerId,
    action: "CREATE_LISTING",
    entityId: input.transactionId,
    entityType: "Deal" as any, // Pipeline deals are linked to transactions
  });
  if (!guard.allowed) {
    throw new Error(guard.reason || "Unauthorized brokerage action.");
  }

  const tx = await getTransactionById(input.transactionId);
  if (!tx) throw new Error("Transaction not found");
  if (tx.brokerId !== input.brokerId) throw new Error("Broker mismatch");

  const existing = await prisma.lecipmPipelineDeal.findUnique({
    where: { transactionId: input.transactionId },
  });
  if (existing) throw new Error("Pipeline deal already linked to this transaction");

  const year = new Date().getFullYear();

  const deal = await prisma.$transaction(async (client) => {
    const seq = await allocateNextDealSequence(client, year);
    const dealNumber = formatDealNumber(year, seq);

    const row = await client.lecipmPipelineDeal.create({
      data: {
        brokerId: input.brokerId,
        transactionId: input.transactionId,
        listingId: tx.listingId ?? undefined,
        dealNumber,
        title: input.title?.slice(0, 512) ?? tx.title ?? `Pipeline — ${tx.transactionNumber}`,
        dealType: input.dealType?.slice(0, 32) ?? tx.transactionType.slice(0, 32),
        pipelineStage: "SCREENING",
        decisionStatus: "PENDING",
        ownerUserId: input.actorUserId ?? undefined,
        latestTransactionNumber: tx.transactionNumber,
      },
    });

    await client.lecipmPipelineDealStageHistory.create({
      data: {
        dealId: row.id,
        fromStage: null,
        toStage: "SCREENING",
        changedByUserId: input.actorUserId ?? undefined,
        reason: "Deal created from transaction",
      },
    });

    await appendDealAuditEvent(client, {
      dealId: row.id,
      eventType: "DEAL_CREATED",
      actorUserId: input.actorUserId,
      summary: `Deal ${dealNumber} linked to ${tx.transactionNumber}`,
      metadataJson: { dealNumber, transactionId: input.transactionId },
    });

    return row;
  });

  if (
    input.brokerDecisionAttested &&
    brokerDecisionAuthorityEnforced() &&
    input.brokerDecisionConfirmedByUserId
  ) {
    await recordOaciqBrokerDecision({
      responsibleBrokerId: input.brokerId,
      decisionType: "PIPELINE_DEAL_CREATE",
      confirmedByUserId: input.brokerDecisionConfirmedByUserId,
      scope: {
        pipelineDealId: deal.id,
        listingId: deal.listingId ?? null,
        metadata: { lecipmSdTransactionId: input.transactionId },
      },
    });
  }

  logInfo(TAG, { action: "createFromTx", id: deal.id });
  return deal;
}

export async function getDealById(dealId: string) {
  return prisma.lecipmPipelineDeal.findUnique({
    where: { id: dealId },
    include: {
      listing: { select: { id: true, listingCode: true, title: true } },
      transaction: { select: { id: true, transactionNumber: true, status: true } },
      broker: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function buildDealSummary(dealId: string) {
  const deal = await getDealById(dealId);
  if (!deal) return null;

  const [openCritical, openAny, blockedTasks, tasksOpen, stageHistories, latestDecision, auditTail] =
    await Promise.all([
      prisma.lecipmPipelineDealCondition.count({
        where: { dealId, priority: "CRITICAL", status: "OPEN" },
      }),
      prisma.lecipmPipelineDealCondition.count({
        where: { dealId, status: { in: ["OPEN", "IN_PROGRESS"] } },
      }),
      prisma.lecipmPipelineDealDiligenceTask.count({
        where: { dealId, status: "BLOCKED" },
      }),
      prisma.lecipmPipelineDealDiligenceTask.count({
        where: { dealId, status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] } },
      }),
      prisma.lecipmPipelineDealStageHistory.findMany({
        where: { dealId },
        orderBy: { createdAt: "asc" },
      }),
      prisma.lecipmPipelineDealCommitteeDecision.findFirst({
        where: { dealId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.lecipmPipelineDealAuditEvent.findMany({
        where: { dealId },
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
    ]);

  const readinessLabel = computeReadinessLabel(deal.pipelineStage, openCritical, blockedTasks, openAny);

  const blockers: string[] = [];
  if (openCritical > 0) blockers.push(`${openCritical} critical condition(s) open`);
  if (blockedTasks > 0) blockers.push(`${blockedTasks} diligence task(s) blocked`);

  return {
    deal,
    openCriticalConditionsCount: openCritical,
    openConditionsCount: openAny,
    openTasksCount: tasksOpen,
    latestCommitteeDecision: latestDecision,
    stageHistory: stageHistories,
    readinessLabel,
    blockers,
    auditEvents: auditTail,
  };
}

function computeReadinessLabel(
  stage: string,
  criticalOpen: number,
  blockedTasks: number,
  openConditions: number
): "READY" | "CONDITIONAL" | "BLOCKED" | "DECLINED" | "HOLD" {
  if (stage === "DECLINED") return "DECLINED";
  if (stage === "ON_HOLD") return "HOLD";
  if (criticalOpen > 0 || blockedTasks > 0) return "BLOCKED";
  if (stage === "CONDITIONAL_APPROVAL" || (openConditions > 0 && stage !== "EXECUTION" && stage !== "SCREENING"))
    return "CONDITIONAL";
  if ((stage === "EXECUTION" || stage === "APPROVED") && criticalOpen === 0 && blockedTasks === 0) return "READY";
  return "BLOCKED";
}

export type DealListFilters = {
  stage?: string | null;
  decisionStatus?: string | null;
  priority?: string | null;
  brokerId?: string | null;
  dealNumberPrefix?: string | null;
  transactionNumber?: string | null;
};

export async function listPipelineDeals(params: DealListFilters & { scopeBrokerId?: string }) {
  const where: {
    brokerId?: string;
    pipelineStage?: string;
    decisionStatus?: string;
    priority?: string;
    dealNumber?: { startsWith: string };
    latestTransactionNumber?: { contains: string };
  } = {};

  if (params.scopeBrokerId) where.brokerId = params.scopeBrokerId;
  if (params.stage) where.pipelineStage = params.stage;
  if (params.decisionStatus) where.decisionStatus = params.decisionStatus;
  if (params.priority) where.priority = params.priority;
  if (params.brokerId) where.brokerId = params.brokerId;
  if (params.dealNumberPrefix) {
    where.dealNumber = { startsWith: params.dealNumberPrefix };
  }
  if (params.transactionNumber) {
    where.latestTransactionNumber = { contains: params.transactionNumber };
  }

  return prisma.lecipmPipelineDeal.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      broker: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function listCommitteeQueueDeals() {
  return prisma.lecipmPipelineDeal.findMany({
    where: { pipelineStage: "COMMITTEE_REVIEW" },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      broker: { select: { id: true, name: true, email: true } },
      committeeSubmissions: {
        orderBy: { submittedAt: "desc" },
        take: 1,
      },
    },
  });
}
