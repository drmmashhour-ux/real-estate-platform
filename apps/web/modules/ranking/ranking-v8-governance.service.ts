/**
 * Read-only governance dashboard payload — aggregates shadow DB + derived scorecard (no writes).
 */
import { rankingV8ShadowFlags } from "@/config/feature-flags";
import { logInfo } from "@/lib/logger";
import { prisma } from "@/lib/db";
import { compareRankingV8LiveVsShadow, deriveShadowOrderFromShadowRows } from "./ranking-v8-comparison.service";
import {
  buildRollbackSignals,
  deriveCurrentPhase,
  deriveRolloutRecommendation,
} from "./ranking-v8-governance-advisory";
import type { RankingV8GovernancePayload } from "./ranking-v8-governance.types";
import { buildRankingV8ValidationInputsFromComparison } from "./ranking-v8-validation-scoring-bridge";
import { buildRankingV8ValidationScorecard } from "./ranking-v8-validation-scoring.service";
import { RANKING_V8_VALIDATION_MAX_TOTAL } from "./ranking-v8-validation-scoring.constants";
import type { RankingV8ShadowEvaluationSummary } from "./ranking-v8-shadow.types";

const NS = "[ranking:v8:governance]";
const READ_MS = 2400;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | "timeout"> {
  return Promise.race([
    p.then((x) => x as T),
    new Promise<"timeout">((r) => setTimeout(() => r("timeout"), ms)),
  ]);
}

function parseSummaryPayload(raw: unknown): RankingV8ShadowEvaluationSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.rows)) return null;
  return o as unknown as RankingV8ShadowEvaluationSummary;
}

function liveOrderIdsFromRows(rows: RankingV8ShadowEvaluationSummary["rows"]): string[] {
  const sorted = [...rows].sort((a, b) => a.liveRankIndex - b.liveRankIndex);
  return sorted.map((r) => r.listingId);
}

function meaningfulImprovementRate(rows: RankingV8ShadowEvaluationSummary["rows"]): number | null {
  if (rows.length === 0) return null;
  const ok = rows.filter((r) => r.delta != null && r.delta > 2).length;
  return ok / rows.length;
}

function topFiveSet(rows: RankingV8ShadowEvaluationSummary["rows"]): Set<string> {
  const sorted = [...rows].sort((a, b) => a.liveRankIndex - b.liveRankIndex);
  return new Set(sorted.slice(0, 5).map((r) => r.listingId));
}

function top5ChurnBetween(
  a: RankingV8ShadowEvaluationSummary | null,
  b: RankingV8ShadowEvaluationSummary | null,
): number | null {
  if (!a?.rows?.length || !b?.rows?.length) return null;
  const A = topFiveSet(a.rows);
  const B = topFiveSet(b.rows);
  let diff = 0;
  for (const id of A) if (!B.has(id)) diff += 1;
  for (const id of B) if (!A.has(id)) diff += 1;
  return diff / 10;
}

export type LoadRankingV8GovernanceParams = {
  days?: number;
  limit?: number;
  offsetDays?: number;
};

/**
 * Best-effort load; never throws — returns partial payload with `meta.missingSources` on failure paths.
 */
export async function loadRankingV8GovernancePayload(
  params: LoadRankingV8GovernanceParams = {},
): Promise<RankingV8GovernancePayload> {
  try {
    return await loadRankingV8GovernancePayloadInner(params);
  } catch (e) {
    logInfo(NS, {
      event: "unexpected_error",
      message: e instanceof Error ? e.message : String(e),
    });
    return staticGovernanceFallback({
      days: Math.min(90, Math.max(1, params.days ?? 7)),
      limit: Math.min(50, Math.max(1, params.limit ?? 10)),
      offsetDays: Math.max(0, params.offsetDays ?? 0),
      missingSources: [`governance:unexpected:${e instanceof Error ? e.message : String(e)}`],
      sourcesUsed: [],
      queryFingerprintLatest: null,
      latestCreatedAt: null,
    });
  }
}

async function loadRankingV8GovernancePayloadInner(
  params: LoadRankingV8GovernanceParams = {},
): Promise<RankingV8GovernancePayload> {
  const days = Math.min(90, Math.max(1, params.days ?? 7));
  const limit = Math.min(50, Math.max(1, params.limit ?? 10));
  const offsetDays = Math.max(0, params.offsetDays ?? 0);
  const historyCap = Math.min(limit, 15);
  /** One DB round-trip: latest + previous + history rows. */
  const fetchTake = Math.min(50, Math.max(historyCap, 2));

  const sourcesUsed: string[] = [];
  const missingSources: string[] = [];

  let latest: RankingV8ShadowEvaluationSummary | null = null;
  let previous: RankingV8ShadowEvaluationSummary | null = null;
  let queryFingerprintLatest: string | null = null;
  let latestCreatedAt: Date | null = null;
  let observationRows: Array<{ payload: unknown; createdAt: Date }> = [];

  try {
    const until = new Date();
    until.setDate(until.getDate() - offsetDays);
    const since = new Date(until);
    since.setDate(since.getDate() - days);

    const q = prisma.rankingShadowObservation.findMany({
      where: { createdAt: { gte: since, lte: until } },
      orderBy: { createdAt: "desc" },
      take: fetchTake,
      select: { payload: true, createdAt: true },
    });

    const res = await withTimeout(q, READ_MS);
    if (res === "timeout") {
      missingSources.push("ranking_shadow_observations:timeout");
    } else {
      sourcesUsed.push("ranking_shadow_observations");
      observationRows = res;
      if (res.length > 0) {
        latest = parseSummaryPayload(res[0].payload);
        latestCreatedAt = res[0].createdAt;
        if (latest) queryFingerprintLatest = latest.queryFingerprint;
        if (res.length > 1) previous = parseSummaryPayload(res[1].payload);
      } else {
        missingSources.push("ranking_shadow_observations:empty_range");
      }
    }
  } catch {
    missingSources.push("ranking_shadow_observations:error");
  }

  let comparison = null as ReturnType<typeof compareRankingV8LiveVsShadow> | null;
  if (latest?.rows?.length) {
    try {
      const liveOrderedIds = liveOrderIdsFromRows(latest.rows);
      const shadowOrderedIds = deriveShadowOrderFromShadowRows(latest.rows);
      comparison = compareRankingV8LiveVsShadow({
        liveOrderedIds,
        shadowOrderedIds,
      });
      sourcesUsed.push("derived_comparison");
    } catch {
      missingSources.push("comparison:derive_failed");
    }
  } else {
    missingSources.push("comparison:no_rows");
  }

  const malformedObservationRate =
    latest?.rows?.length && latest.rows.some((r) => r.shadowScore == null)
      ? latest.rows.filter((r) => r.shadowScore == null).length / latest.rows.length
      : null;

  const mi = latest?.rows?.length ? meaningfulImprovementRate(latest.rows) : null;
  const validationInputs = buildRankingV8ValidationInputsFromComparison(comparison, {
    meaningfulImprovementRate: mi,
    stability: {
      repeatQueryConsistency: null,
      top5ChurnRate: top5ChurnBetween(latest, previous),
      largeRankJumpRate:
        comparison && comparison.perListing.length
          ? comparison.perListing.filter((p) => p.absRankShift >= 5).length /
            Math.max(1, comparison.perListing.length)
          : null,
    },
    userImpact: {
      ctrDelta: null,
      saveRateDelta: null,
      contactRateDelta: null,
      leadRateDelta: null,
      bookingRateDelta: null,
    },
    safety: {
      influenceSkipRate: null,
      shadowErrorRate: null,
      asyncFailureRate: null,
      rankingCrashCount: null,
      malformedObservationRate,
    },
    coverage: {
      highTrafficQueriesRepresented: (latest?.listingCount ?? 0) > 30 ? true : null,
      lowTrafficQueriesRepresented:
        (latest?.listingCount ?? 0) > 0 && (latest?.listingCount ?? 0) <= 15 ? true : null,
      denseInventoryRepresented: (latest?.listingCount ?? 0) >= 12 ? true : null,
      sparseInventoryRepresented:
        (latest?.listingCount ?? 0) > 0 && (latest?.listingCount ?? 0) < 10 ? true : null,
      cityZoneDiversityRepresented: null,
      priceRangeDiversityRepresented: null,
    },
    meta: {
      listingsEvaluated: latest?.rows?.length ?? undefined,
      queriesAnalyzed: undefined,
    },
  });

  let scorecard = null as ReturnType<typeof buildRankingV8ValidationScorecard> | null;
  try {
    scorecard = buildRankingV8ValidationScorecard(validationInputs);
    sourcesUsed.push("validation_scorecard");
  } catch {
    missingSources.push("scorecard:build_failed");
  }

  if (!scorecard) {
    try {
      scorecard = buildRankingV8ValidationScorecard(
        buildRankingV8ValidationInputsFromComparison(null, {}),
      );
      sourcesUsed.push("validation_scorecard");
      missingSources.push("scorecard:fallback_empty");
    } catch {
      missingSources.push("scorecard:fallback_failed");
      return staticGovernanceFallback({
        days,
        limit,
        offsetDays,
        missingSources,
        sourcesUsed,
        queryFingerprintLatest,
        latestCreatedAt,
      });
    }
  }

  const flagsSlice = {
    rankingV8ShadowEvaluatorV1: rankingV8ShadowFlags.rankingV8ShadowEvaluatorV1,
    rankingV8InfluenceV1: rankingV8ShadowFlags.rankingV8InfluenceV1,
    rankingV8ValidationScoringV1: rankingV8ShadowFlags.rankingV8ValidationScoringV1,
  };

  const rollout = deriveRolloutRecommendation({
    scorecard,
    flags: flagsSlice,
    comparison,
    combinedWarnings: [...scorecard.notes],
  });

  const metrics: RankingV8GovernancePayload["metrics"] = {
    top5Overlap: comparison?.agreementRateTop5 ?? null,
    top10Overlap: comparison?.agreementRateTop10 ?? null,
    avgRankShift: comparison?.avgRankShift ?? null,
    top5ChurnRate: validationInputs.stability.top5ChurnRate ?? null,
    repeatConsistency: validationInputs.stability.repeatQueryConsistency,
    largeJumpRate: validationInputs.stability.largeRankJumpRate ?? null,
    ctrDelta: validationInputs.userImpact.ctrDelta,
    saveDelta: validationInputs.userImpact.saveRateDelta,
    leadDelta: validationInputs.userImpact.leadRateDelta,
  };

  const coverage: RankingV8GovernancePayload["coverage"] = {
    highTraffic: validationInputs.coverage.highTrafficQueriesRepresented,
    lowTraffic: validationInputs.coverage.lowTrafficQueriesRepresented,
    denseInventory: validationInputs.coverage.denseInventoryRepresented,
    sparseInventory: validationInputs.coverage.sparseInventoryRepresented,
    geoDiversity: validationInputs.coverage.cityZoneDiversityRepresented,
    priceDiversity: validationInputs.coverage.priceRangeDiversityRepresented,
  };

  const rollbackSignals = buildRollbackSignals({
    comparison,
    scorecard,
    metrics,
    malformedObservationRate,
  });

  const history: RankingV8GovernancePayload["history"] = [];
  try {
    const histSlice = observationRows.slice(0, historyCap);
    for (const row of histSlice) {
      const sum = parseSummaryPayload(row.payload);
      if (!sum?.rows?.length) continue;
      try {
        const liveOrderedIds = liveOrderIdsFromRows(sum.rows);
        const shadowOrderedIds = deriveShadowOrderFromShadowRows(sum.rows);
        const cmp = compareRankingV8LiveVsShadow({ liveOrderedIds, shadowOrderedIds });
        const inp = buildRankingV8ValidationInputsFromComparison(cmp, {
          meaningfulImprovementRate: meaningfulImprovementRate(sum.rows),
        });
        const sc = buildRankingV8ValidationScorecard(inp);
        const rr = deriveRolloutRecommendation({
          scorecard: sc,
          flags: flagsSlice,
          comparison: cmp,
          combinedWarnings: [...sc.notes],
        });
        history.push({
          ts: sum.evaluatedAt || row.createdAt.toISOString(),
          totalScore: sc.totalScore,
          decision: sc.decision,
          recommendation: rr.recommendation,
        });
      } catch {
        missingSources.push("history:row_partial");
      }
    }
  } catch {
    missingSources.push("history:partial");
  }

  const dataFreshnessMs = latestCreatedAt ? Math.max(0, Date.now() - latestCreatedAt.getTime()) : null;

  const payload: RankingV8GovernancePayload = {
    scorecard: {
      totalScore: scorecard.totalScore,
      maxScore: scorecard.maxScore,
      categoryScores: {
        quality: scorecard.categoryScores.quality.score,
        stability: scorecard.categoryScores.stability.score,
        userImpact: scorecard.categoryScores.userImpact.score,
        safety: scorecard.categoryScores.safety.score,
        coverage: scorecard.categoryScores.coverage.score,
      },
      rawMetrics: {
        quality: {
          top5OverlapRate: validationInputs.quality.top5OverlapRate,
          top10OverlapRate: validationInputs.quality.top10OverlapRate,
          avgRankShift: validationInputs.quality.avgRankShift,
        },
        stability: {
          repeatQueryConsistency: validationInputs.stability.repeatQueryConsistency,
          top5ChurnRate: validationInputs.stability.top5ChurnRate,
          largeRankJumpRate: validationInputs.stability.largeRankJumpRate,
        },
      },
      decision: scorecard.decision,
    },
    rollout: {
      currentPhase: deriveCurrentPhase(flagsSlice),
      recommendation: rollout.recommendation,
      targetPhase: rollout.targetPhase,
      readiness: rollout.readiness,
      blockingReasons: rollout.blockingReasons,
      warnings: rollout.warnings,
    },
    metrics,
    coverage,
    rollbackSignals,
    history,
    meta: {
      dataFreshnessMs,
      sourcesUsed,
      missingSources,
      queryFingerprintLatest,
    },
  };

  logInfo(NS, {
    event: "payload_loaded",
    days,
    limit,
    offsetDays,
    dataFreshnessMs,
    missingSourcesCount: missingSources.length,
    recommendation: payload.rollout.recommendation,
    totalScore: payload.scorecard.totalScore,
  });

  return payload;
}

function staticGovernanceFallback(input: {
  days: number;
  limit: number;
  offsetDays: number;
  missingSources: string[];
  sourcesUsed: string[];
  queryFingerprintLatest: string | null;
  latestCreatedAt: Date | null;
}): RankingV8GovernancePayload {
  const flagsSlice = {
    rankingV8ShadowEvaluatorV1: rankingV8ShadowFlags.rankingV8ShadowEvaluatorV1,
    rankingV8InfluenceV1: rankingV8ShadowFlags.rankingV8InfluenceV1,
    rankingV8ValidationScoringV1: rankingV8ShadowFlags.rankingV8ValidationScoringV1,
  };
  const dataFreshnessMs = input.latestCreatedAt
    ? Math.max(0, Date.now() - input.latestCreatedAt.getTime())
    : null;
  logInfo(NS, {
    event: "payload_loaded",
    days: input.days,
    limit: input.limit,
    offsetDays: input.offsetDays,
    dataFreshnessMs,
    missingSourcesCount: input.missingSources.length,
    recommendation: "stay_in_shadow",
    totalScore: 0,
  });
  return {
    scorecard: {
      totalScore: 0,
      maxScore: RANKING_V8_VALIDATION_MAX_TOTAL,
      categoryScores: { quality: 0, stability: 0, userImpact: 0, safety: 0, coverage: 0 },
      decision: "not_ready",
    },
    rollout: {
      currentPhase: deriveCurrentPhase(flagsSlice),
      recommendation: "stay_in_shadow",
      targetPhase: "shadow_only",
      readiness: {
        qualityReady: false,
        stabilityReady: false,
        safetyReady: false,
        coverageReady: false,
        userImpactReady: false,
        userImpactNa: true,
      },
      blockingReasons: ["scorecard_unavailable"],
      warnings: ["governance:static_fallback"],
    },
    metrics: {
      top5Overlap: null,
      top10Overlap: null,
      avgRankShift: null,
      top5ChurnRate: null,
      repeatConsistency: null,
      largeJumpRate: null,
      ctrDelta: null,
      saveDelta: null,
      leadDelta: null,
    },
    coverage: {
      highTraffic: null,
      lowTraffic: null,
      denseInventory: null,
      sparseInventory: null,
      geoDiversity: null,
      priceDiversity: null,
    },
    rollbackSignals: {
      severeOverlapDrop: false,
      instabilitySpike: false,
      errorPresent: false,
      negativeUserImpact: false,
    },
    history: [],
    meta: {
      dataFreshnessMs,
      sourcesUsed: input.sourcesUsed,
      missingSources: [...input.missingSources, "scorecard:unrecoverable"],
      queryFingerprintLatest: input.queryFingerprintLatest,
    },
  };
}
