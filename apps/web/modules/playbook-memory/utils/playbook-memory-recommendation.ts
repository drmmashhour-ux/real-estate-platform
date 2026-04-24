import type { MemoryPlaybook, PlaybookScoreBand } from "@prisma/client";
import type { RecommendationRequestContext } from "../types/playbook-memory.types";

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function scopeOverlap(
  req: Record<string, string | number | boolean | null> | undefined,
  scope: unknown,
): number {
  if (!req || !scope || typeof scope !== "object" || Array.isArray(scope)) {
    return 0;
  }
  const s = scope as Record<string, unknown>;
  const targetKeys = Object.keys(s);
  if (targetKeys.length === 0) return 0;
  let match = 0;
  for (const k of targetKeys) {
    if (req[k] === undefined) continue;
    if (String(req[k]) === String(s[k])) {
      match += 1;
    }
  }
  return match / targetKeys.length;
}

/**
 * 0..1. If playbook has no segment/market scope JSON, return moderate 0.55.
 * Otherwise blend segment and market overlap with the request.
 */
export function computeContextFitScore(
  requestContext: RecommendationRequestContext,
  playbook: MemoryPlaybook,
): number {
  const seg = requestContext.segment ?? {};
  const mkt = requestContext.market ?? {};
  const hasSeg =
    playbook.segmentScope != null &&
    typeof playbook.segmentScope === "object" &&
    !Array.isArray(playbook.segmentScope) &&
    Object.keys(playbook.segmentScope as object).length > 0;
  const hasMkt =
    playbook.marketScope != null &&
    typeof playbook.marketScope === "object" &&
    !Array.isArray(playbook.marketScope) &&
    Object.keys(playbook.marketScope as object).length > 0;
  if (!hasSeg && !hasMkt) {
    return 0.55;
  }
  let part = 0.55;
  if (hasSeg) {
    const o = scopeOverlap(seg, playbook.segmentScope);
    part = 0.35 + 0.65 * o;
  }
  if (hasMkt) {
    const o = scopeOverlap(mkt, playbook.marketScope);
    const m = 0.35 + 0.65 * o;
    part = hasSeg ? (part + m) / 2 : m;
  }
  return clamp01(part);
}

export function computeSuccessRate(playbook: MemoryPlaybook): number {
  const t = playbook.totalExecutions;
  if (t <= 0) {
    return 0;
  }
  return clamp01(playbook.successfulExecutions / t);
}

const BAND: Record<PlaybookScoreBand, number> = {
  ELITE: 1,
  HIGH: 0.78,
  MEDIUM: 0.52,
  LOW: 0.28,
};

export function computeScoreBandValue(band: PlaybookScoreBand): number {
  return BAND[band] ?? 0.28;
}

export function computeExecutionVolumeScore(totalExecutions: number): number {
  if (totalExecutions <= 0) {
    return 0;
  }
  return clamp01(Math.log10(1 + totalExecutions) / 3);
}

/** Risk penalty 0..1 from average realized risk (higher = worse for score). */
export function computeRiskPenalty(avgRiskScore: number | null | undefined): number {
  if (avgRiskScore == null || !Number.isFinite(avgRiskScore)) {
    return 0;
  }
  return clamp01(avgRiskScore);
}

export function computeRecommendationScore(params: {
  contextFit: number;
  successRate: number;
  bandValue: number;
  volumeScore: number;
  riskPenalty: number;
}): number {
  const { contextFit, successRate, bandValue, volumeScore, riskPenalty } = params;
  return clamp01(
    contextFit * 0.25 +
      successRate * 0.25 +
      bandValue * 0.2 +
      volumeScore * 0.15 +
      (1 - riskPenalty) * 0.15,
  );
}

export function buildPlaybookRecommendationRationale(params: {
  contextFit: number;
  successRate: number;
  scoreBand: PlaybookScoreBand;
  totalExecutions: number;
  avgRiskScore: number | null;
  lastPromotedAt: Date | null;
  policyBlocked: boolean;
}): string[] {
  const r: string[] = [];
  if (params.contextFit > 0.75) {
    r.push("Strong context fit to declared segment / market scope.");
  } else if (params.contextFit > 0.5) {
    r.push("Moderate context fit (scopes overlap partially).");
  } else {
    r.push("Context fit is moderate — scopes are broad or only partially specified.");
  }
  if (params.successRate > 0.6) {
    r.push("Historical success rate is solid for this playbook.");
  }
  if (params.scoreBand === "ELITE" || params.scoreBand === "HIGH") {
    r.push(`Aggregate ${params.scoreBand} performance band.`);
  }
  if (params.avgRiskScore != null && params.avgRiskScore < 0.3) {
    r.push("Average realized risk has stayed low in aggregate.");
  }
  if (params.lastPromotedAt) {
    const days = (Date.now() - params.lastPromotedAt.getTime()) / 86_400_000;
    if (days < 30) {
      r.push("Recently promoted / activated version in governance.");
    }
  }
  if (params.totalExecutions < 3) {
    r.push("Limited execution history — treat as exploratory.");
  }
  if (params.policyBlocked) {
    r.push("Policy / governance rules apply — see blocked reasons.");
  }
  if (r.length === 0) {
    r.push("Ranked from deterministic play metrics and context fit only.");
  }
  return r.slice(0, 6);
}
