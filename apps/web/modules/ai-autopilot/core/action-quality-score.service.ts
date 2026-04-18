import type { PlatformAutopilotAction } from "@prisma/client";
import type { RankedAction } from "../ai-autopilot.types";
import { profitPriorityScore } from "./profit-priority.service";
import { computeNoisePenalty } from "./action-noise-penalty.service";
import { computeValueScore } from "./action-value-score.service";

export type ActionQualityResult = {
  qualityScore: number;
  valueScore: number;
  noisePenalty: number;
  reasons: string[];
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * 0–100 quality score — composes value heuristic, structured evidence, safety, minus noise penalties.
 */
export function computeActionQualityScore(
  action: RankedAction,
  ctx?: {
    duplicateRefresh?: boolean;
    existingDuplicateCount?: number;
    existing?: Pick<PlatformAutopilotAction, "status" | "createdAt" | "updatedAt"> | null;
  },
): ActionQualityResult {
  const reasons: string[] = [];

  const conf = clamp(typeof action.confidence === "number" ? action.confidence : 0.5, 0, 1);
  const confPts = Math.round(conf * 35);
  reasons.push(`confidence ${confPts}/35`);

  const { valueScore, notes: valueNotes } = computeValueScore(action);
  reasons.push(...valueNotes.map((n) => `value: ${n}`));

  const profit = profitPriorityScore(action);
  const impactPts = clamp(Math.round((profit + 30) * 0.4), 0, 25);
  reasons.push(`impact ${impactPts}/25`);

  const urgencyPts =
    action.bucket === "do_now" ? 15 : action.bucket === "do_today" ? 12 : action.bucket === "do_this_week" ? 8 : 3;
  reasons.push(`urgency ${urgencyPts}/15`);

  const safetyPts =
    action.riskLevel === "LOW"
      ? 12
      : action.riskLevel === "MEDIUM"
        ? 8
        : action.riskLevel === "HIGH"
          ? 4
          : 0;
  reasons.push(`safety ${safetyPts}/12`);

  let evidencePts = 8;
  const r = action.reasons;
  if (r && typeof r === "object" && Object.keys(r as object).length > 2) evidencePts = 12;
  reasons.push(`evidence ${evidencePts}/12`);

  const noise = computeNoisePenalty(action, ctx);
  reasons.push(...noise.breakdown.map((b) => `noise: ${b}`));

  const raw = confPts + impactPts + urgencyPts + safetyPts + evidencePts - noise.total;
  const qualityScore = clamp(Math.round(raw), 0, 100);

  return {
    qualityScore,
    valueScore,
    noisePenalty: noise.total,
    reasons,
  };
}
