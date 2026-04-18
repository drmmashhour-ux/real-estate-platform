/**
 * V8 ranking comparison — live order vs shadow order (read-only; no ranking side effects).
 */
import { logInfo } from "@/lib/logger";
import type { RankingV8ShadowDiffRow } from "./ranking-v8-shadow.types";
import type {
  RankingV8ComparisonQualitySignals,
  RankingV8ComparisonResult,
  RankingV8ComparisonSummary,
  RankingV8RankShiftRow,
} from "./ranking-v8-comparison.types";

const NS = "[ranking:v8:comparison]";

const DEFAULT_SIGNIFICANT_SHIFT = 4;
const LIVE_TAIL_PROMOTE_THRESHOLD = 15;
const SHADOW_DEMOTE_LIVE_TOP = 10;

function overlapTopN(liveTopSlice: string[], shadowTopSlice: string[]): number {
  const sh = new Set(shadowTopSlice);
  return liveTopSlice.reduce((acc, id) => acc + (sh.has(id) ? 1 : 0), 0);
}

function restrictToCommonOrder(liveOrderedIds: string[], shadowOrderedIds: string[]): { live: string[]; shadow: string[] } {
  const liveSet = new Set(liveOrderedIds);
  const shadowSet = new Set(shadowOrderedIds);
  const common = new Set<string>();
  for (const id of liveOrderedIds) {
    if (shadowSet.has(id)) common.add(id);
  }
  return {
    live: liveOrderedIds.filter((id) => common.has(id)),
    shadow: shadowOrderedIds.filter((id) => common.has(id)),
  };
}

function computeKendallTauLike(live: string[], shadow: string[]): number {
  const posLive = new Map(live.map((id, i) => [id, i]));
  const posShadow = new Map(shadow.map((id, i) => [id, i]));
  const ids = live.filter((id) => posShadow.has(id));
  const n = ids.length;
  if (n < 2) return 1;
  let concordant = 0;
  let discordant = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = ids[i];
      const b = ids[j];
      const lv = posLive.get(a)! - posLive.get(b)!;
      const sv = posShadow.get(a)! - posShadow.get(b)!;
      const prod = lv * sv;
      if (prod > 0) concordant += 1;
      else if (prod < 0) discordant += 1;
    }
  }
  const pairs = concordant + discordant;
  if (pairs === 0) return 1;
  return (concordant - discordant) / pairs;
}

function buildQualitySignals(
  live: string[],
  shadow: string[],
  comparedCount: number,
  avgAbsShift: number,
  kendall: number,
): RankingV8ComparisonQualitySignals {
  const shadowPromotesBeyondLiveRank: string[] = [];
  const shadowDemotesLiveTop: string[] = [];

  const livePos = new Map(live.map((id, i) => [id, i]));
  const shadowPos = new Map(shadow.map((id, i) => [id, i]));

  const shadowTop = new Set(shadow.slice(0, Math.min(10, shadow.length)));
  for (const id of shadowTop) {
    const lp = livePos.get(id);
    if (lp !== undefined && lp >= LIVE_TAIL_PROMOTE_THRESHOLD) {
      shadowPromotesBeyondLiveRank.push(id);
    }
  }

  const liveTop5 = live.slice(0, Math.min(5, live.length));
  for (const id of liveTop5) {
    const sp = shadowPos.get(id);
    if (sp !== undefined && sp >= SHADOW_DEMOTE_LIVE_TOP) {
      shadowDemotesLiveTop.push(id);
    }
  }

  const orderingInstabilityHint =
    comparedCount >= 4 &&
    (avgAbsShift >= Math.min(comparedCount * 0.35, 12) || kendall < 0.35);

  return {
    shadowPromotesBeyondLiveRank: shadowPromotesBeyondLiveRank.slice(0, 20),
    shadowDemotesLiveTop: shadowDemotesLiveTop.slice(0, 20),
    orderingInstabilityHint,
  };
}

function computeStabilityScore(input: {
  comparedCount: number;
  overlapTop10: number;
  avgAbsShift: number;
}): number {
  const { comparedCount, overlapTop10, avgAbsShift } = input;
  const n = Math.max(1, comparedCount);
  const denom = Math.max(1, Math.min(10, n) - 1);
  const overlapNorm = Math.min(10, n) > 0 ? overlapTop10 / Math.min(10, n) : 0;
  const shiftNorm = 1 - Math.min(1, avgAbsShift / denom);
  return Number((0.55 * overlapNorm + 0.45 * shiftNorm).toFixed(4));
}

/**
 * Sort shadow diff rows by shadow score (desc) for a synthetic shadow ranking order.
 * Rows without a finite shadow score are appended with stable id sort.
 */
export function deriveShadowOrderFromShadowRows(rows: RankingV8ShadowDiffRow[]): string[] {
  const scored = rows.filter((r) => r.shadowScore != null && Number.isFinite(r.shadowScore));
  const unscored = rows.filter((r) => r.shadowScore == null || !Number.isFinite(r.shadowScore));
  scored.sort((a, b) => (b.shadowScore! - a.shadowScore!) || a.listingId.localeCompare(b.listingId));
  unscored.sort((a, b) => a.listingId.localeCompare(b.listingId));
  return [...scored, ...unscored].map((r) => r.listingId);
}

export type CompareRankingV8Input = {
  liveOrderedIds: string[];
  shadowOrderedIds: string[];
  /** |shift| ≥ this counts as “significant” (default 4). */
  significantMoveThreshold?: number;
};

/**
 * Compare live vs shadow **position** lists (index 0 = best rank). Read-only.
 */
export function compareRankingV8LiveVsShadow(input: CompareRankingV8Input): RankingV8ComparisonResult {
  const threshold = input.significantMoveThreshold ?? DEFAULT_SIGNIFICANT_SHIFT;
  const { live, shadow } = restrictToCommonOrder(input.liveOrderedIds, input.shadowOrderedIds);
  const comparedCount = live.length;
  const intersectionSize = comparedCount;

  const livePos = new Map(live.map((id, i) => [id, i]));
  const shadowPos = new Map(shadow.map((id, i) => [id, i]));

  const perListing: RankingV8RankShiftRow[] = [];
  let sumAbs = 0;
  let maxAbs = 0;
  let major = 0;

  for (const id of live) {
    const li = livePos.get(id)!;
    const si = shadowPos.get(id)!;
    const rankShift = si - li;
    const absRankShift = Math.abs(rankShift);
    sumAbs += absRankShift;
    maxAbs = Math.max(maxAbs, absRankShift);
    if (absRankShift >= threshold) major += 1;
    perListing.push({ listingId: id, liveRankIndex: li, shadowRankIndex: si, rankShift, absRankShift });
  }

  const avgRankShift = comparedCount > 0 ? Number((sumAbs / comparedCount).toFixed(6)) : 0;
  const pctMovedSignificantly = comparedCount > 0 ? Number(((100 * major) / comparedCount).toFixed(4)) : 0;

  const o3 = overlapTopN(live.slice(0, Math.min(3, live.length)), shadow.slice(0, Math.min(3, shadow.length)));
  const o5 = overlapTopN(live.slice(0, Math.min(5, live.length)), shadow.slice(0, Math.min(5, shadow.length)));
  const o10 = overlapTopN(live.slice(0, Math.min(10, live.length)), shadow.slice(0, Math.min(10, shadow.length)));

  const cap = (overlap: number, n: number) => (n > 0 ? Number((overlap / Math.min(n, comparedCount)).toFixed(6)) : 0);

  const kendallTauLike = computeKendallTauLike(live, shadow);

  const qualitySignals = buildQualitySignals(live, shadow, comparedCount, avgRankShift, kendallTauLike);

  const summary: RankingV8ComparisonSummary = {
    overlapTop3: o3,
    overlapTop5: o5,
    overlapTop10: o10,
    avgRankShift,
    majorMovements: major,
    stabilityScore: computeStabilityScore({ comparedCount, overlapTop10: o10, avgAbsShift: avgRankShift }),
  };

  return {
    comparedCount,
    intersectionSize,
    perListing,
    overlapTop3: o3,
    overlapTop5: o5,
    overlapTop10: o10,
    agreementRateTop3: cap(o3, 3),
    agreementRateTop5: cap(o5, 5),
    agreementRateTop10: cap(o10, 10),
    avgRankShift,
    maxAbsRankShift: maxAbs,
    pctMovedSignificantly,
    kendallTauLike: Number(kendallTauLike.toFixed(6)),
    qualitySignals,
    summary,
  };
}

export function logRankingV8Comparison(result: RankingV8ComparisonResult): void {
  logInfo(NS, {
    event: "live_shadow_rank_compare",
    comparedCount: result.comparedCount,
    overlapTop3: result.overlapTop3,
    overlapTop5: result.overlapTop5,
    overlapTop10: result.overlapTop10,
    avgRankShift: result.avgRankShift,
    maxAbsRankShift: result.maxAbsRankShift,
    pctMovedSignificantly: result.pctMovedSignificantly,
    agreementTop10: result.agreementRateTop10,
    kendallTauLike: result.kendallTauLike,
    majorMovements: result.summary.majorMovements,
    stabilityScore: result.summary.stabilityScore,
    instabilityHint: result.qualitySignals.orderingInstabilityHint,
    promotesBeyondLive: result.qualitySignals.shadowPromotesBeyondLiveRank.length,
    demotesLiveTop: result.qualitySignals.shadowDemotesLiveTop.length,
  });
}
