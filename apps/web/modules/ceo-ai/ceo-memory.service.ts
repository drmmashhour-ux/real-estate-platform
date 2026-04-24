import { prisma } from "@/lib/db";
import type { CeoDecisionProposal, CeoDecisionPayload } from "./ceo-ai.types";
import type { CeoDecision } from "./ceo.types";
import { logCeoMemoryTagged } from "@/lib/server/launch-logger";

/** Maps AI payload kinds to strategic memory decisionType bucket (VarChar(24)). */
export function mapPayloadKindToDecisionType(kind: CeoDecisionPayload["kind"]): string {
  switch (kind) {
    case "pricing_lead_adjust":
    case "pricing_featured_adjust":
    case "pricing_promo_operator":
    case "growth_seo_city_pages":
    case "growth_cta_shift":
    case "growth_family_content":
    case "outreach_operator_city":
    case "outreach_operator_reengage":
    case "outreach_broker_prospects":
      return "INVEST";
    case "retention_broker_email":
    case "retention_operator_profile":
    case "retention_credit_offer":
    case "capital_strategy_shift":
      return "SHIFT_FOCUS";
    case "fund_strategy_change":
    case "fund_reallocation_trigger":
    case "fund_rebalance":
      return "EXPERIMENT";
    case "campaign_recommend":
      return "EXPERIMENT";
    case "operations_note":
    default:
      return "HOLD";
  }
}

/** Flat numeric snapshot for honest before/after outcome comparison. */
export function extractFlatMetricsFromSignals(signals: import("./ceo-ai.types").CeoMarketSignals): Record<string, number> {
  return {
    leadsLast30d: signals.leadsLast30d,
    leadsPrev30d: signals.leadsPrev30d,
    seniorConversionRate30d: signals.seniorConversionRate30d,
    demandIndex: signals.demandIndex,
    revenueTrend30dProxy: signals.revenueTrend30dProxy,
    activeDealsCount: signals.activeDealsCount,
    dealPipelineHealth: signals.dealPipelineHealth,
    esgActivityLevel: signals.esgActivityLevel,
    brokerAccountsApprox: signals.brokerAccountsApprox,
    operatorOnboardedLast90d: signals.operatorOnboardedLast90d,
  };
}

export function extractFlatMetricsFromCeoContext(context: import("./ceo.types").CeoContext): Record<string, number> {
  return {
    growthTrend: context.growth.trend,
    growthConversionRate: context.growth.conversionRate,
    growthLeadsCount: context.growth.leadsCount,
    dealsCloseRate: context.deals.closeRate,
    dealsVolume: context.deals.volume,
    dealsAvgRejectionRate: context.deals.avgRejectionRate,
    esgAvgScore: context.esg.avgScore,
    esgAdoptionRate: context.esg.adoptionRate,
    rolloutActiveCount: context.rollout.activeCount,
    rolloutSuccessRate: context.rollout.successRate,
    agentsSuccessSignals: context.agents.successSignals,
  };
}

/**
 * AI CEO path — idempotent by persisted `ceo_decisions.id` used as memory id.
 */
export async function recordAiCeoProposalAsMemory(
  proposal: CeoDecisionProposal,
  ceoDecisionRowId: string,
  contextFingerprint: string,
  metricsSnapshot: Record<string, number>,
): Promise<void> {
  const fp = contextFingerprint.slice(0, 128);
  const decisionType = mapPayloadKindToDecisionType(proposal.payload.kind);
  const domain = proposal.domain.slice(0, 24);

  const payloadJson = {
    ...proposal.payload,
    source: "ai_ceo",
    title: proposal.title,
    metricsSnapshot,
  };

  await prisma.ceoDecisionMemory.upsert({
    where: { id: ceoDecisionRowId },
    create: {
      id: ceoDecisionRowId,
      decisionType,
      domain,
      contextFingerprint: fp,
      payloadJson: payloadJson as object,
      reasoning: proposal.rationale,
      confidence: proposal.confidence ?? undefined,
      createdAt: new Date(),
    },
    update: {
      payloadJson: payloadJson as object,
      reasoning: proposal.rationale,
      confidence: proposal.confidence ?? undefined,
      contextFingerprint: fp,
    },
  });

  logCeoMemoryTagged.info("decision_recorded", {
    memoryId: ceoDecisionRowId,
    domain,
    decisionType,
    source: "ai_ceo",
  });
}

/**
 * Strategic CEO routing path — idempotent by decision id.
 */
export async function recordCeoDecisionMemory(
  decision: CeoDecision,
  contextFingerprint: string,
  metricsSnapshot: Record<string, number>,
): Promise<void> {
  const fp = contextFingerprint.slice(0, 128);
  const payloadJson = {
    ...decision.payloadJson,
    source: "strategic_ceo",
    metricsSnapshot,
  };

  await prisma.ceoDecisionMemory.upsert({
    where: { id: decision.id },
    create: {
      id: decision.id,
      decisionType: decision.decisionType,
      domain: decision.domain.slice(0, 24),
      contextFingerprint: fp,
      payloadJson: payloadJson as object,
      reasoning: decision.reasoning,
      confidence: decision.confidence,
      createdAt: decision.createdAt,
    },
    update: {
      payloadJson: payloadJson as object,
      reasoning: decision.reasoning,
      confidence: decision.confidence,
      contextFingerprint: fp,
    },
  });

  logCeoMemoryTagged.info("decision_recorded", {
    memoryId: decision.id,
    domain: decision.domain,
    decisionType: decision.decisionType,
    source: "strategic_ceo",
  });
}

export class CeoMemoryService {
  static recordCeoDecisionMemory = recordCeoDecisionMemory;

  static async recordCeoDecisionOutcome(params: {
    memoryId: string;
    outcomeWindowDays: number;
    metricsBefore: Record<string, unknown>;
    metricsAfter: Record<string, unknown>;
    impactScore: number;
    resultLabel: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  }) {
    return prisma.ceoDecisionOutcome.create({
      data: {
        memoryId: params.memoryId,
        outcomeWindowDays: params.outcomeWindowDays,
        metricsBeforeJson: params.metricsBefore as object,
        metricsAfterJson: params.metricsAfter as object,
        impactScore: params.impactScore,
        resultLabel: params.resultLabel,
      },
    });
  }

  static async getRelevantPastDecisions(contextFingerprint: string, domain: string) {
    return prisma.ceoDecisionMemory.findMany({
      where: {
        domain,
        contextFingerprint,
      },
      include: {
        outcomes: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
  }
}
