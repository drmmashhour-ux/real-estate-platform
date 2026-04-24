import { prisma } from "@/lib/db";
import { CeoDecisionProposal, CeoMarketSignals, CeoDomain } from "./ceo-ai.types";
import { buildCeoContextFingerprint } from "./ceo-memory-context.service";
import { Prisma } from "@prisma/client";
import { aiCeoLog } from "../ai-ceo/ai-ceo-log";
import { logActivity } from "@/lib/audit/activity-log";

/**
 * PHASE 3: DECISION MEMORY SERVICE
 * Stores and retrieves CEO strategic decisions and their context.
 */

/**
 * Records a CEO decision into long-term memory with its context fingerprint.
 * Called when the CEO engine proposes or executes a decision.
 */
export async function recordCeoDecisionMemory(
  decision: CeoDecisionProposal,
  context: CeoMarketSignals
) {
  const fingerprint = buildCeoContextFingerprint(context);
  
  // Map internal payload kind to a strategic decision type
  const decisionType = mapPayloadKindToDecisionType(decision.payload.kind);

  // Use a transaction or a check to prevent duplicate spam for the exact same decision in the same hour
  const hourAgo = new Date(Date.now() - 3600000);
  const existing = await prisma.ceoDecisionMemory.findFirst({
    where: {
      domain: decision.domain,
      contextFingerprint: fingerprint,
      decisionType,
      createdAt: { gte: hourAgo },
    },
    select: { id: true }
  });

  if (existing) return existing;

  const memory = await prisma.ceoDecisionMemory.create({
    data: {
      decisionType,
      domain: decision.domain,
      contextFingerprint: fingerprint,
      payloadJson: {
        ...(decision.payload as any),
        _contextSignals: context, // Store signals for later outcome evaluation
      },
      reasoning: decision.rationale,
      confidence: decision.confidence,
    },
  });

  aiCeoLog("info", "decision_memory_recorded", { memoryId: memory.id, domain: decision.domain });
  void logActivity({
    action: "decision_memory_recorded",
    entityType: "CeoDecisionMemory",
    entityId: memory.id,
    metadata: { domain: decision.domain, decisionType }
  });

  return memory;
}

/**
 * Records the real-world outcome of a strategic decision.
 */
export async function recordCeoDecisionOutcome(params: {
  memoryId: string;
  outcomeWindowDays: number;
  metricsBefore: CeoMarketSignals;
  metricsAfter: CeoMarketSignals;
  impactScore: number;
  resultLabel: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
}) {
  const outcome = await prisma.ceoDecisionOutcome.create({
    data: {
      memoryId: params.memoryId,
      outcomeWindowDays: params.outcomeWindowDays,
      metricsBeforeJson: params.metricsBefore as any,
      metricsAfterJson: params.metricsAfter as any,
      impactScore: params.impactScore,
      resultLabel: params.resultLabel,
    },
  });

  aiCeoLog("info", "decision_outcome_recorded", { 
    outcomeId: outcome.id, 
    memoryId: params.memoryId, 
    label: params.resultLabel 
  });
  
  void logActivity({
    action: "decision_outcome_recorded",
    entityType: "CeoDecisionOutcome",
    entityId: outcome.id,
    metadata: { memoryId: params.memoryId, resultLabel: params.resultLabel }
  });

  return outcome;
}

/**
 * Retrieves past decisions made in similar contexts.
 */
export async function getRelevantPastDecisions(contextFingerprint: string, domain?: string) {
  return prisma.ceoDecisionMemory.findMany({
    where: {
      contextFingerprint,
      ...(domain ? { domain } : {}),
    },
    include: {
      outcomes: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });
}

/**
 * Maps the specific action kind to a broader strategic decision type.
 */
export function mapPayloadKindToDecisionType(kind: string): string {
  switch (kind) {
    case "growth_seo_city_pages":
    case "growth_family_content":
    case "growth_cta_shift":
    case "outreach_operator_city":
    case "outreach_operator_reengage":
    case "outreach_broker_prospects":
      return "INVEST";
    
    case "pricing_lead_adjust":
    case "pricing_featured_adjust":
    case "pricing_promo_operator":
      return "EXPERIMENT";
    
    case "retention_broker_email":
    case "retention_operator_profile":
    case "retention_credit_offer":
      return "INVEST";
    
    case "campaign_recommend":
    case "capital_strategy_shift":
    case "fund_strategy_change":
      return "SHIFT_FOCUS";
    
    case "fund_reallocation_trigger":
    case "fund_rebalance":
      return "EXPERIMENT";
    
    case "operations_note":
      return "HOLD";
    
    default:
      return "SHIFT_FOCUS";
  }
}
