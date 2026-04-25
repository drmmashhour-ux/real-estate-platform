import { prisma } from "@/lib/db";
import { normalizeConfidence } from "@/lib/ai/confidence";
import { reputationTrustFactorForAutomation } from "@/lib/ai/reputation/reputation-engine";
import { getHostDecisionMultipliers } from "./host-behavior";

const SIGNAL_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const NEUTRAL = 0.5;

export type ComputeDecisionScoreInput = {
  ruleName: string;
  hostId: string;
  listingId?: string | null;
  confidence: number;
};

export type DecisionScoreResult = {
  score: number;
  reasons: string[];
};

/** Inputs already resolved (for tests and composition). */
export type DecisionFactors = {
  ruleSuccessRate: number;
  ruleHasData: boolean;
  bestTemplateScore: number;
  templateHasData: boolean;
  calibratedConfidence: number;
  repeatedRejections: boolean;
  recentRevert: boolean;
};

/**
 * Multi-factor score in [0, 1]:
 * - rule success rate × 0.4
 * - best template proxy × 0.2
 * - calibrated confidence × 0.2
 * - repeated rejections −0.2, recent revert −0.2
 */
export function computeDecisionScoreFromFactors(f: DecisionFactors): DecisionScoreResult {
  const reasons: string[] = [];
  let score = 0;

  score += f.ruleSuccessRate * 0.4;
  if (f.ruleHasData && f.ruleSuccessRate < 0.3) {
    reasons.push("low rule performance");
  }

  score += f.bestTemplateScore * 0.2;
  if (f.templateHasData && f.bestTemplateScore > 0.6) {
    reasons.push("high template success");
  }

  score += f.calibratedConfidence * 0.2;

  if (f.repeatedRejections) {
    score -= 0.2;
    reasons.push("recent rejections");
  }
  if (f.recentRevert) {
    score -= 0.2;
    reasons.push("recent revert");
  }

  const clamped = Math.min(1, Math.max(0, score));
  return { score: clamped, reasons };
}

/** Success rate from Host Autopilot `AiTemplatePerformance` (per rule). */
function autopilotTemplateRowScore(row: { impressions: number; successes: number }): number {
  if (row.impressions <= 0) return 0;
  return Math.min(1, row.successes / row.impressions);
}

export async function computeDecisionScore(input: ComputeDecisionScoreInput): Promise<DecisionScoreResult> {
  const since = new Date(Date.now() - SIGNAL_WINDOW_MS);
  const outcomeBase = {
    hostId: input.hostId,
    ruleName: input.ruleName,
    createdAt: { gte: since },
  };
  const outcomeWhere = input.listingId
    ? { ...outcomeBase, OR: [{ listingId: input.listingId }, { listingId: null }] }
    : outcomeBase;

  const [ruleRow, tplRows, rejectCount, revertCount] = await Promise.all([
    prisma.aiRulePerformance.findUnique({
      where: { ruleName: input.ruleName },
      select: { total: true, successCount: true },
    }),
    prisma.aiTemplatePerformance.findMany({
      where: { ruleName: input.ruleName },
      select: { impressions: true, successes: true },
    }),
    prisma.aiOutcomeSignal.count({
      where: {
        ...outcomeWhere,
        outcomeType: { in: ["rejected", "failure"] },
      },
    }),
    prisma.aiOutcomeSignal.count({
      where: {
        ...outcomeWhere,
        outcomeType: "reverted",
      },
    }),
  ]);

  const ruleHasData = Boolean(ruleRow && ruleRow.total > 0);
  const ruleSuccessRate = ruleHasData && ruleRow ? ruleRow.successCount / ruleRow.total : NEUTRAL;

  let best = 0;
  let templateHasData = false;
  for (const r of tplRows) {
    if (r.impressions <= 0) continue;
    templateHasData = true;
    best = Math.max(best, autopilotTemplateRowScore(r));
  }
  const bestTemplateScore = templateHasData ? best : NEUTRAL;

  const calibratedConfidence = normalizeConfidence(input.confidence);
  const repeatedRejections = rejectCount >= 2;
  const recentRevert = revertCount >= 1;

  const base = computeDecisionScoreFromFactors({
    ruleSuccessRate,
    ruleHasData,
    bestTemplateScore,
    templateHasData,
    calibratedConfidence,
    repeatedRejections,
    recentRevert,
  });

  const mult = await getHostDecisionMultipliers(input.hostId, input.ruleName);
  const hp = await prisma.hostPerformance.findUnique({
    where: { hostId: input.hostId },
    select: { score: true },
  });
  const repTrust = reputationTrustFactorForAutomation(hp?.score ?? null);
  const personalized = Math.min(
    1,
    Math.max(0, base.score * mult.ruleWeight * mult.ignorePenaltyFactor * repTrust),
  );
  const extra = [...base.reasons, ...mult.extraReasons];
  if (repTrust < 0.98) extra.push("host reputation: cautious automation weight");
  if (repTrust > 1.01) extra.push("host reputation: elevated trust weight");
  return {
    score: personalized,
    reasons: extra,
  };
}

export function shouldExecute(score: number): boolean {
  return score >= 0.3;
}

export type ExecutionBand = "suppress" | "normal" | "prioritize";

export function getExecutionBand(score: number): ExecutionBand {
  if (score < 0.3) return "suppress";
  if (score <= 0.6) return "normal";
  return "prioritize";
}

export function suppressionReasonForScore(score: number): string {
  return `score_below_0.3:${score.toFixed(3)}`;
}
