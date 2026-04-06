import { logManagerAction } from "@/lib/ai/logger";
import { prisma } from "@/lib/db";
import { autopilotConfidenceMultiplierFromScore } from "@/lib/ai/reputation/reputation-engine";
import { getCalibratedConfidence } from "@/lib/ai/learning/confidence-calibration";
import {
  computeDecisionScore,
  getExecutionBand,
  shouldExecute,
  suppressionReasonForScore,
} from "@/lib/ai/learning/decision-engine";

export type AutopilotGateOk = {
  ok: true;
  confidence: number;
  decisionScore: number;
  reasons: string[];
  band: ReturnType<typeof getExecutionBand>;
};

export type AutopilotGateBlocked = {
  ok: false;
  decisionScore: number;
  reasons: string[];
  suppressionReason: string;
};

export async function gateAutopilotRecommendation(input: {
  ruleName: string;
  hostId: string;
  listingId?: string | null;
  baseConfidence: number;
  logActionKey: string;
  targetEntityType: string;
  targetEntityId: string;
  logPayloadExtra?: Record<string, unknown>;
}): Promise<AutopilotGateOk | AutopilotGateBlocked> {
  const hp = await prisma.hostPerformance.findUnique({
    where: { hostId: input.hostId },
    select: { score: true },
  });
  const repMult = autopilotConfidenceMultiplierFromScore(hp?.score ?? null);
  const adjustedBase = Math.min(0.99, Math.max(0.15, input.baseConfidence * repMult));
  const calibratedBase = await getCalibratedConfidence(input.ruleName, adjustedBase);
  const decision = await computeDecisionScore({
    ruleName: input.ruleName,
    hostId: input.hostId,
    listingId: input.listingId,
    confidence: calibratedBase,
  });
  if (!shouldExecute(decision.score)) {
    const suppressionReason = suppressionReasonForScore(decision.score);
    await logManagerAction({
      userId: input.hostId,
      actionKey: input.logActionKey,
      targetEntityType: input.targetEntityType,
      targetEntityId: input.targetEntityId,
      status: "suppressed",
      decisionScore: decision.score,
      suppressionReason,
      payload: {
        decisionReasons: decision.reasons,
        decisionEngine: "multi_factor",
        ...(input.logPayloadExtra ?? {}),
      },
    });
    return {
      ok: false,
      decisionScore: decision.score,
      reasons: decision.reasons,
      suppressionReason,
    };
  }
  const band = getExecutionBand(decision.score);
  const confidence =
    band === "prioritize" ? Math.min(0.99, calibratedBase + 0.08) : calibratedBase;
  return {
    ok: true,
    confidence,
    decisionScore: decision.score,
    reasons: decision.reasons,
    band,
  };
}
