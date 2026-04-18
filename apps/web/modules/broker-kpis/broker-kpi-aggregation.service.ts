import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type {
  BrokerKpiSnapshot,
  ClosingKpiGroup,
  CommunicationKpiGroup,
  CoordinationKpiGroup,
  DealKpiGroup,
  ExecutionKpiGroup,
  KpiDateRange,
  KpiWindow,
  LeadKpiGroup,
  NegotiationKpiGroup,
  OverdueBlockersGroup,
  WorkloadSummaryGroup,
} from "./broker-kpis.types";
import { brokerKpiDisclaimer } from "./broker-kpi-explainer";

const ACTIVE_DEAL = { notIn: ["closed", "cancelled"] as string[] };

export function resolveKpiDateRange(window: KpiWindow, custom?: { from: string; to: string }): KpiDateRange {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  if (window === "custom" && custom?.from && custom?.to) {
    const start = new Date(custom.from);
    const e = new Date(custom.to);
    e.setHours(23, 59, 59, 999);
    return { start, end: e, label: window };
  }

  const start = new Date();
  if (window === "today") {
    start.setHours(0, 0, 0, 0);
    return { start, end, label: window };
  }

  const dayMs = 86400000;
  let days = 7;
  if (window === "30d") days = 30;
  if (window === "quarter") days = 90;
  if (window === "year") days = 365;
  start.setTime(end.getTime() - days * dayMs);
  start.setHours(0, 0, 0, 0);
  return { start, end, label: window };
}

export async function aggregateBrokerKpis(brokerId: string, range: KpiDateRange): Promise<Omit<BrokerKpiSnapshot, "window" | "disclaimer">> {
  const { start, end } = range;
  const dealBase: Prisma.DealWhereInput = { brokerId };

  const dealIdsRows = await prisma.deal.findMany({
    where: dealBase,
    select: { id: true },
  });
  const dealIds = dealIdsRows.map((d) => d.id);

  const [
    newLeads,
    warmLeads,
    hotLeads,
    followUpOverdue,
    outboundComm,
    inboundComm,
    draftsPending,
    activeDeals,
    closedInWindow,
    dealsDrafting,
    awaitingSig,
    awaitingConditions,
    closingReady,
    docsDraft,
    docsReview,
    execBrokerReview,
    copilotPending,
    counterProposals,
    totalProposals,
    docReqOverdue,
    docReqOpen,
    tasksPastDue,
    milestonesSoon,
    assignedLeadDeals,
    teamAssignActive,
  ] = await Promise.all([
    prisma.lead.count({
      where: {
        introducedByBrokerId: brokerId,
        createdAt: { gte: start, lte: end },
      },
    }),
    prisma.lead.count({
      where: {
        introducedByBrokerId: brokerId,
        aiTier: "warm",
        createdAt: { gte: start, lte: end },
      },
    }),
    prisma.lead.count({
      where: {
        introducedByBrokerId: brokerId,
        aiTier: "hot",
        createdAt: { gte: start, lte: end },
      },
    }),
    prisma.lead.count({
      where: {
        OR: [{ introducedByBrokerId: brokerId }, { lastFollowUpByBrokerId: brokerId }],
        nextFollowUpAt: { lt: new Date() },
        pipelineStatus: { notIn: ["won", "lost"] },
      },
    }),
    prisma.lecipmCommunicationLog.count({
      where: {
        brokerId,
        direction: "outbound",
        createdAt: { gte: start, lte: end },
      },
    }),
    prisma.lecipmCommunicationLog.count({
      where: {
        brokerId,
        direction: "inbound",
        createdAt: { gte: start, lte: end },
      },
    }),
    prisma.lecipmCommunicationDraft.count({
      where: {
        brokerId,
        status: { in: ["draft", "pending_approval"] },
      },
    }),
    prisma.deal.count({ where: { ...dealBase, status: ACTIVE_DEAL } }),
    prisma.deal.count({
      where: {
        ...dealBase,
        status: "closed",
        updatedAt: { gte: start, lte: end },
      },
    }),
    prisma.deal.count({
      where: {
        ...dealBase,
        status: ACTIVE_DEAL,
        contractWorkflowState: { in: ["intake", "drafting", "draft", "broker_review"] },
      },
    }),
    prisma.deal.count({
      where: {
        ...dealBase,
        OR: [{ lecipmExecutionPipelineState: "awaiting_signature" }, { lecipmExecutionPipelineState: "partially_signed" }],
        status: ACTIVE_DEAL,
      },
    }),
    prisma.deal.count({
      where: {
        ...dealBase,
        lecipmExecutionPipelineState: "conditions_pending",
        status: ACTIVE_DEAL,
      },
    }),
    prisma.deal.count({
      where: {
        ...dealBase,
        lecipmExecutionPipelineState: "closing_ready",
        status: ACTIVE_DEAL,
      },
    }),
    dealIds.length === 0
      ? 0
      : prisma.dealDocument.count({
          where: {
            dealId: { in: dealIds },
            OR: [{ workflowStatus: "draft" }, { workflowStatus: null }],
          },
        }),
    dealIds.length === 0
      ? 0
      : prisma.dealDocument.count({
          where: { dealId: { in: dealIds }, workflowStatus: "broker_review" },
        }),
    prisma.deal.count({
      where: { ...dealBase, lecipmExecutionPipelineState: "broker_review_required", status: ACTIVE_DEAL },
    }),
    dealIds.length === 0
      ? 0
      : prisma.dealCopilotSuggestion.count({
          where: { dealId: { in: dealIds }, status: "pending" },
        }),
    dealIds.length === 0
      ? 0
      : prisma.negotiationProposal.count({
          where: {
            createdAt: { gte: start, lte: end },
            proposalType: "counter_offer",
            round: { thread: { dealId: { in: dealIds } } },
          },
        }),
    dealIds.length === 0
      ? 0
      : prisma.negotiationProposal.count({
          where: {
            createdAt: { gte: start, lte: end },
            round: { thread: { dealId: { in: dealIds } } },
          },
        }),
    dealIds.length === 0
      ? 0
      : prisma.dealRequest.count({
          where: {
            dealId: { in: dealIds },
            status: { notIn: ["FULFILLED", "CANCELLED"] },
            dueAt: { lt: new Date() },
          },
        }),
    dealIds.length === 0
      ? 0
      : prisma.dealRequest.count({
          where: {
            dealId: { in: dealIds },
            status: { notIn: ["FULFILLED", "CANCELLED", "BLOCKED"] },
          },
        }),
    prisma.lecipmBrokerTask.count({
      where: {
        brokerId,
        status: "open",
        dueAt: { lt: new Date() },
      },
    }),
    dealIds.length === 0
      ? 0
      : prisma.dealMilestone.count({
          where: {
            dealId: { in: dealIds },
            status: "pending",
            dueDate: { lte: new Date(Date.now() + 3 * 86400000) },
          },
        }),
    prisma.brokerDealAssignment.count({
      where: {
        assignedToUserId: brokerId,
        status: "active",
        roleOnDeal: "lead_broker",
      },
    }),
    prisma.brokerDealAssignment.count({
      where: { assignedToUserId: brokerId, status: "active" },
    }),
  ]);

  const avgResponse = await computeAvgResponseHours(brokerId, start, end);
  const closing = await computeClosingKpis(dealBase, start, end);
  const coordination = await computeCoordinationKpis(dealIds, start, end, docReqOverdue, docReqOpen);

  const lead: LeadKpiGroup = {
    newLeads,
    warmLeads,
    hotLeads,
    followUpOverdue,
    avgResponseTimeHours: avgResponse.avg,
    responseSampleSize: avgResponse.n,
  };

  const communication: CommunicationKpiGroup = {
    outboundMessages: outboundComm,
    inboundMessages: inboundComm,
    draftsPendingApproval: draftsPending,
  };

  const deal: DealKpiGroup = {
    activeDeals,
    dealsInDrafting: dealsDrafting,
    dealsAwaitingSignature: awaitingSig,
    dealsAwaitingConditions: awaitingConditions,
    dealsClosingReady: closingReady,
    dealsClosedInWindow: closedInWindow,
  };

  const execution: ExecutionKpiGroup = {
    documentsInDraft: docsDraft,
    documentsBrokerReview: docsReview,
    executionPipelineBrokerReview: execBrokerReview,
    copilotSuggestionsPending: copilotPending,
  };

  const negotiation: NegotiationKpiGroup = {
    counterOffersInWindow: counterProposals,
    proposalsInWindow: totalProposals,
    counterOfferRate: totalProposals > 0 ? counterProposals / totalProposals : null,
  };

  const overdue: OverdueBlockersGroup = {
    openTasksPastDue: tasksPastDue,
    milestonesDueSoon: milestonesSoon,
    dealRequestsPastDue: docReqOverdue,
  };

  const workload: WorkloadSummaryGroup = {
    assignedDealsAsLead: assignedLeadDeals,
    pendingReviewItems: docsReview + copilotPending,
    activeTeamAssignments: teamAssignActive,
  };

  return {
    range: { startIso: start.toISOString(), endIso: end.toISOString() },
    generatedAt: new Date().toISOString(),
    lead,
    communication,
    deal,
    execution,
    negotiation,
    closing,
    coordination,
    overdue,
    workload,
  };
}

async function computeAvgResponseHours(
  brokerId: string,
  start: Date,
  end: Date,
): Promise<{ avg: number | null; n: number }> {
  const leads = await prisma.lead.findMany({
    where: {
      introducedByBrokerId: brokerId,
      createdAt: { gte: start, lte: end },
    },
    select: { id: true, createdAt: true },
    take: 200,
  });
  if (leads.length === 0) return { avg: null, n: 0 };

  const deltas: number[] = [];
  for (const l of leads) {
    const first = await prisma.crmInteraction.findFirst({
      where: { leadId: l.id, brokerId },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });
    if (first) {
      deltas.push((first.createdAt.getTime() - l.createdAt.getTime()) / 3600000);
    }
  }
  if (deltas.length === 0) return { avg: null, n: 0 };
  const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  return { avg: Math.round(avg * 10) / 10, n: deltas.length };
}

async function computeClosingKpis(
  dealBase: Prisma.DealWhereInput,
  start: Date,
  end: Date,
): Promise<ClosingKpiGroup> {
  const closed = await prisma.deal.findMany({
    where: {
      ...dealBase,
      status: "closed",
      updatedAt: { gte: start, lte: end },
    },
    select: { createdAt: true, updatedAt: true },
    take: 500,
  });
  let sumDays = 0;
  for (const d of closed) {
    sumDays += (d.updatedAt.getTime() - d.createdAt.getTime()) / (3600000 * 24);
  }
  const offerToCloseDaysAvg = closed.length ? Math.round((sumDays / closed.length) * 10) / 10 : null;

  const cancelled = await prisma.deal.count({
    where: {
      ...dealBase,
      status: "cancelled",
      updatedAt: { gte: start, lte: end },
    },
  });

  const denom = closed.length + cancelled;
  const closingConversionRate = denom > 0 ? closed.length / denom : null;

  return {
    offerToCloseDaysAvg,
    offerToCloseSampleSize: closed.length,
    closingConversionRate:
      closingConversionRate !== null ? Math.round(closingConversionRate * 1000) / 1000 : null,
  };
}

async function computeCoordinationKpis(
  dealIds: string[],
  start: Date,
  end: Date,
  documentRequestsOverdue: number,
  documentRequestsOpen: number,
): Promise<CoordinationKpiGroup> {
  if (dealIds.length === 0) {
    return {
      documentRequestsOverdue,
      documentRequestsOpen,
      signatureCompletionHoursMedian: null,
      signatureSessionsCompleted: 0,
      paymentConfirmationLagHoursAvg: null,
      paymentConfirmationSamples: 0,
    };
  }

  const sessions = await prisma.signatureSession.findMany({
    where: {
      dealId: { in: dealIds },
      createdAt: { gte: start, lte: end },
      status: "completed",
    },
    select: { createdAt: true, updatedAt: true },
    take: 200,
  });

  const hours: number[] = [];
  for (const s of sessions) {
    hours.push((s.updatedAt.getTime() - s.createdAt.getTime()) / 3600000);
  }
  hours.sort((a, b) => a - b);
  const mid = Math.floor(hours.length / 2);
  const signatureCompletionHoursMedian =
    hours.length === 0 ? null : hours.length % 2 ? hours[mid] : (hours[mid - 1]! + hours[mid]!) / 2;

  const payments = await prisma.lecipmDealPayment.findMany({
    where: {
      dealId: { in: dealIds },
      requestedAt: { not: null },
      confirmedAt: { not: null },
      updatedAt: { gte: start, lte: end },
    },
    select: { requestedAt: true, confirmedAt: true },
    take: 200,
  });
  const lags: number[] = [];
  for (const p of payments) {
    if (p.requestedAt && p.confirmedAt) {
      lags.push((p.confirmedAt.getTime() - p.requestedAt.getTime()) / 3600000);
    }
  }
  const paymentConfirmationLagHoursAvg =
    lags.length > 0 ? Math.round((lags.reduce((a, b) => a + b, 0) / lags.length) * 10) / 10 : null;

  return {
    documentRequestsOverdue,
    documentRequestsOpen,
    signatureCompletionHoursMedian:
      signatureCompletionHoursMedian !== null ? Math.round(signatureCompletionHoursMedian * 10) / 10 : null,
    signatureSessionsCompleted: sessions.length,
    paymentConfirmationLagHoursAvg,
    paymentConfirmationSamples: lags.length,
  };
}

export function buildBrokerKpiSnapshot(
  window: KpiWindow,
  range: KpiDateRange,
  core: Omit<BrokerKpiSnapshot, "window" | "disclaimer">,
): BrokerKpiSnapshot {
  return {
    window,
    disclaimer: brokerKpiDisclaimer(),
    ...core,
  };
}
