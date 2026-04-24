import { prisma } from "@/lib/db";
import { CeoMarketSignals } from "./ceo-ai.types";
import { gatherMarketSignals } from "./ceo-ai.service";
import { aiCeoLog } from "../ai-ceo/ai-ceo-log";
import { logActivity } from "@/lib/audit/activity-log";

/**
 * PHASE 4: OUTCOME EVALUATION FOR CEO DECISIONS
 * Compares platform state before and after a strategic decision.
 * Determines if a decision had the intended effect.
 */

/**
 * Evaluates the outcome of a past CEO decision by comparing metrics.
 */
export async function evaluateCeoDecisionOutcome(memoryId: string) {
  const memory = await prisma.ceoDecisionMemory.findUnique({
    where: { id: memoryId },
    include: { outcomes: true },
  });

  if (!memory) throw new Error("Memory not found");
  
  // Skip if already evaluated multiple times (can re-evaluate if window changes)
  if (memory.outcomes.length >= 1) return memory.outcomes[0];

  const daysPassed = (Date.now() - memory.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  
  // We need a minimum window for data to accumulate
  if (daysPassed < 1) return null;

  const payload = memory.payloadJson as any;
  const metricsBefore = payload?._contextSignals as CeoMarketSignals;
  
  if (!metricsBefore) {
    console.warn(`[ceo-outcome] No baseline metrics for memory ${memoryId}`);
    return null;
  }

  const metricsAfter = await gatherMarketSignals();

  const evaluation = computeOutcome(
    memory.decisionType,
    memory.domain,
    metricsBefore,
    metricsAfter
  );

  const outcome = await prisma.ceoDecisionOutcome.create({
    data: {
      memoryId,
      outcomeWindowDays: Math.floor(daysPassed),
      metricsBeforeJson: metricsBefore as any,
      metricsAfterJson: metricsAfter as any,
      impactScore: evaluation.impactScore,
      resultLabel: evaluation.resultLabel,
    },
  });

  aiCeoLog("info", "decision_outcome_recorded", { 
    memoryId, 
    outcomeId: outcome.id, 
    resultLabel: evaluation.resultLabel 
  });
  void logActivity({
    action: "decision_outcome_recorded",
    entityType: "CeoDecisionOutcome",
    entityId: outcome.id,
    metadata: { memoryId, resultLabel: evaluation.resultLabel, impactScore: evaluation.impactScore }
  });

  return outcome;
}

/**
 * Core logic to compare metrics and assign a score.
 */
function computeOutcome(
  type: string,
  domain: string,
  before: CeoMarketSignals,
  after: CeoMarketSignals
): { impactScore: number; resultLabel: string; reasoning: string } {
  let impactScore = 0;
  let resultLabel: "POSITIVE" | "NEUTRAL" | "NEGATIVE" = "NEUTRAL";
  let reasoning = "";

  switch (domain) {
    case "GROWTH": {
      const leadLift = (after.leadsLast30d - before.leadsLast30d) / (before.leadsLast30d || 1);
      impactScore = leadLift * 100;
      if (leadLift > 0.05) resultLabel = "POSITIVE";
      else if (leadLift < -0.05) resultLabel = "NEGATIVE";
      reasoning = `Lead volume changed by ${(leadLift * 100).toFixed(1)}%`;
      break;
    }
    
    case "PRICING": {
      const revTrendChange = after.revenueTrend30dProxy - before.revenueTrend30dProxy;
      impactScore = revTrendChange * 500;
      if (revTrendChange > 0.01) resultLabel = "POSITIVE";
      else if (revTrendChange < -0.01) resultLabel = "NEGATIVE";
      reasoning = `Revenue trend shifted by ${(revTrendChange * 100).toFixed(2)}%`;
      break;
    }

    case "RETENTION": {
      const convDelta = after.seniorConversionRate30d - before.seniorConversionRate30d;
      impactScore = convDelta * 1000;
      if (convDelta > 0.005) resultLabel = "POSITIVE";
      else if (convDelta < -0.005) resultLabel = "NEGATIVE";
      reasoning = `Conversion rate shifted by ${(convDelta * 100).toFixed(2)}%`;
      break;
    }

    case "OUTREACH": {
      const replyRateDelta = (after.outreachReplyRateProxy || 0) - (before.outreachReplyRateProxy || 0);
      impactScore = replyRateDelta * 200;
      if (replyRateDelta > 0.02) resultLabel = "POSITIVE";
      else if (replyRateDelta < -0.02) resultLabel = "NEGATIVE";
      reasoning = `Outreach reply rate proxy shifted by ${(replyRateDelta * 100).toFixed(1)}%`;
      break;
    }

    case "DEALS": {
      const pipelineDelta = after.dealPipelineHealth - before.dealPipelineHealth;
      impactScore = pipelineDelta * 100;
      if (pipelineDelta > 0.05) resultLabel = "POSITIVE";
      else if (pipelineDelta < -0.05) resultLabel = "NEGATIVE";
      reasoning = `Deal pipeline health shifted by ${(pipelineDelta * 100).toFixed(1)}%`;
      break;
    }

    case "ESG": {
      const esgDelta = after.esgActivityLevel - before.esgActivityLevel;
      impactScore = esgDelta * 100;
      if (esgDelta > 0.1) resultLabel = "POSITIVE";
      else if (esgDelta < -0.1) resultLabel = "NEGATIVE";
      reasoning = `ESG activity level shifted by ${(esgDelta * 100).toFixed(1)}%`;
      break;
    }

    case "CAPITAL": {
      const dealCountDelta = after.activeDealsCount - before.activeDealsCount;
      impactScore = dealCountDelta * 5;
      if (dealCountDelta > 0) resultLabel = "POSITIVE";
      else if (dealCountDelta < 0) resultLabel = "NEGATIVE";
      reasoning = `Active deals count changed by ${dealCountDelta}`;
      break;
    }

    default:
      // Fallback to leads
      impactScore = (after.leadsLast30d - before.leadsLast30d) > 0 ? 10 : -10;
      resultLabel = impactScore > 0 ? "POSITIVE" : "NEGATIVE";
      reasoning = "General health fallback check";
  }

  // Bound impact score
  impactScore = Math.max(-100, Math.min(100, impactScore));

  return { impactScore, resultLabel, reasoning };
}
