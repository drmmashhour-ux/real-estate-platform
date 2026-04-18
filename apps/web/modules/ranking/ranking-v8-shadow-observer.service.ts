/**
 * V8 shadow ranking observer — runs after live sort; does not mutate ordering or live scores.
 */
import { createHash } from "node:crypto";
import { isPlatformCoreAuditEffective, rankingV8ShadowFlags } from "@/config/feature-flags";
import { logInfo, logWarn } from "@/lib/logger";
import { prisma } from "@/lib/db";
import { createAuditEvent } from "@/modules/platform-core/platform-core.repository";
import { PLATFORM_CORE_AUDIT } from "@/modules/platform-core/platform-core.constants";
import type { ListingSearchParams } from "@/lib/bnhub/listings";
import type { RankingV8ComparisonResult } from "./ranking-v8-comparison.types";
import {
  compareRankingV8LiveVsShadow,
  deriveShadowOrderFromShadowRows,
  logRankingV8Comparison,
} from "./ranking-v8-comparison.service";
import { buildRankingV8ValidationInputsFromComparison } from "./ranking-v8-validation-scoring-bridge";
import {
  buildRankingV8ValidationScorecard,
  logRankingV8ValidationScorecard,
} from "./ranking-v8-validation-scoring.service";
import type { ApplyRankingV8InfluenceOutput } from "./ranking-v8-influence.service";
import {
  buildRankingV8ShadowDiffRows,
  summarizeRankingV8ShadowDiffs,
} from "./ranking-v8-shadow-evaluator.service";
import type {
  RankingV8ShadowDiffRow,
  RankingV8ShadowEvaluationSummary,
  RankingV8ShadowInfluenceMeta,
} from "./ranking-v8-shadow.types";

const NS = "[ranking:v8:shadow]";
const MAX_LISTINGS = 40;

type ListingRow = { id: string };

export type ScheduleRankingV8ShadowInput = {
  params: ListingSearchParams;
  scored: Array<{ listing: ListingRow; rankingScore: number | null }>;
  sorted: Array<{ listing: ListingRow; rankingScore: number | null }>;
  /** When Phase C influence path already computed rows + comparison (skip duplicate async build). */
  precomputedEvaluation?: {
    rows: RankingV8ShadowDiffRow[];
    comparison: RankingV8ComparisonResult;
  };
  /** Influence metadata for persistence/audit (no listing array). */
  influenceMeta?: Omit<ApplyRankingV8InfluenceOutput, "output"> | null;
};

function fingerprintParams(p: ListingSearchParams): string {
  try {
    const raw = JSON.stringify(p);
    return createHash("sha256").update(raw).digest("hex").slice(0, 16);
  } catch {
    return "unknown";
  }
}

/**
 * Fire-and-forget parallel shadow evaluation. Safe when flag off (no-op).
 * Does not block the ranked search response; failures are logged only.
 */
export function scheduleRankingV8ShadowEvaluation(input: ScheduleRankingV8ShadowInput): void {
  if (!rankingV8ShadowFlags.rankingV8ShadowEvaluatorV1) {
    return;
  }
  void runRankingV8ShadowEvaluationAsync(input).catch((e) => {
    logWarn(NS, "shadow evaluation async failed (live ordering unaffected)", {
      message: e instanceof Error ? e.message : String(e),
    });
  });
}

async function runRankingV8ShadowEvaluationAsync(input: ScheduleRankingV8ShadowInput): Promise<void> {
  const queryFingerprint = fingerprintParams(input.params);
  const liveOrderListingIds = input.sorted.map((s) => s.listing.id);

  const rows =
    input.precomputedEvaluation?.rows ??
    (await buildRankingV8ShadowDiffRows({
      scored: input.scored,
      liveOrderListingIds,
      maxListings: MAX_LISTINGS,
    }));
  const aggregate = summarizeRankingV8ShadowDiffs(rows);

  const comparison =
    input.precomputedEvaluation?.comparison ??
    (() => {
      const rowIds = new Set(rows.map((r) => r.listingId));
      const liveForCompare = liveOrderListingIds.filter((id) => rowIds.has(id));
      const shadowOrder = deriveShadowOrderFromShadowRows(rows);
      return compareRankingV8LiveVsShadow({
        liveOrderedIds: liveForCompare,
        shadowOrderedIds: shadowOrder,
      });
    })();
  if (!input.precomputedEvaluation) {
    logRankingV8Comparison(comparison);
  }

  if (rankingV8ShadowFlags.rankingV8ValidationScoringV1) {
    const validationInputs = buildRankingV8ValidationInputsFromComparison(comparison, {
      meta: {
        listingsEvaluated: rows.length,
        queriesAnalyzed: input.scored.length,
      },
    });
    const scorecard = buildRankingV8ValidationScorecard(validationInputs);
    logRankingV8ValidationScorecard(scorecard);
    if (rankingV8ShadowFlags.rankingV8ValidationScoringPersistenceV1) {
      logInfo("[ranking:v8:scorecard]", {
        event: "persistence_deferred",
        note: "No Prisma model in this revision — export scorecard from logs or wire external store.",
        decision: scorecard.decision,
      });
    }
  }

  const summary: RankingV8ShadowEvaluationSummary = {
    evaluatedAt: new Date().toISOString(),
    queryFingerprint,
    listingCount: input.scored.length,
    cappedTo: Math.min(input.scored.length, MAX_LISTINGS),
    rows,
    aggregate,
    ...(input.influenceMeta ? { influence: input.influenceMeta as RankingV8ShadowInfluenceMeta } : {}),
  };

  logInfo(NS, {
    queryFingerprint,
    listingCount: summary.listingCount,
    cappedTo: summary.cappedTo,
    meanAbsDelta: aggregate.meanAbsDelta,
    maxAbsDelta: aggregate.maxAbsDelta,
  });

  if (rankingV8ShadowFlags.rankingV8ShadowPersistenceV1) {
    try {
      await prisma.rankingShadowObservation.create({
        data: {
          queryFingerprint,
          listingCount: input.scored.length,
          payload: summary as object,
        },
      });
    } catch (e) {
      logWarn(NS, "ranking shadow persistence failed", {
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  if (isPlatformCoreAuditEffective()) {
    try {
      await createAuditEvent({
        eventType: PLATFORM_CORE_AUDIT.RANKING_SHADOW_V8_EVALUATION,
        source: "UNIFIED",
        entityType: "SURFACE",
        entityId: null,
        message: `Ranking V8 shadow: n=${rows.length} meanAbsDelta=${aggregate.meanAbsDelta} fp=${queryFingerprint}${
          summary.influence?.applied ? ` influence=on boosts=${summary.influence.boostsApplied}` : ""
        }`,
        metadata: {
          queryFingerprint,
          aggregate,
          cappedTo: summary.cappedTo,
          listingCount: summary.listingCount,
          ...(summary.influence ? { influence: summary.influence } : {}),
        },
      });
    } catch (e) {
      logWarn(NS, "audit event failed", { message: e instanceof Error ? e.message : String(e) });
    }
  }
}
