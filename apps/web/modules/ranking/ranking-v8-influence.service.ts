/**
 * Ranking V8 Phase C — bounded, gated reordering on top of live sort (does not recompute live scores).
 */
import { logInfo } from "@/lib/logger";
import type { RankingV8ComparisonResult } from "./ranking-v8-comparison.types";
import { deriveShadowOrderFromShadowRows } from "./ranking-v8-comparison.service";
import type { RankingV8ShadowDiffRow } from "./ranking-v8-shadow.types";
import type { RankingV8InfluenceResult } from "./ranking-v8-influence.types";

const NS = "[ranking:v8:influence]";

/** Only the first K positions may be adjusted. */
export const RANKING_V8_INFLUENCE_TOP_ZONE = 20;
/** Max adjacent swaps each listing may participate in (bounds net movement). */
export const RANKING_V8_INFLUENCE_MAX_SWAPS_PER_LISTING = 2;
/** Bubble passes over the zone (2 × top zone iterations caps drift). */
const INFLUENCE_PASSES = 2;

export type RankingV8InfluenceItem = { listing: { id: string }; rankingScore: number | null };

export type ApplyRankingV8InfluenceInput = {
  liveSorted: RankingV8InfluenceItem[];
  shadowRows: RankingV8ShadowDiffRow[];
  comparison: RankingV8ComparisonResult;
};

export type ApplyRankingV8InfluenceOutput = RankingV8InfluenceResult & {
  output: RankingV8InfluenceItem[];
};

function gatesOk(
  liveSorted: RankingV8InfluenceItem[],
  shadowRows: RankingV8ShadowDiffRow[],
  comparison: RankingV8ComparisonResult,
): { ok: boolean; reason?: string } {
  if (liveSorted.length < 10) {
    return { ok: false, reason: "small_result_set" };
  }
  if (comparison.comparedCount < 8) {
    return { ok: false, reason: "low_compared_count" };
  }
  if (comparison.summary.stabilityScore < 0.42) {
    return { ok: false, reason: "low_stability" };
  }
  if (comparison.comparedCount >= 10 && comparison.summary.overlapTop10 < 4) {
    return { ok: false, reason: "low_top10_overlap" };
  }
  if (comparison.avgRankShift > 9) {
    return { ok: false, reason: "high_live_shadow_divergence" };
  }
  if (shadowRows.length === 0) {
    return { ok: false, reason: "no_shadow_rows" };
  }
  const malformed = shadowRows.filter((r) => r.shadowScore == null || r.delta == null).length;
  if (malformed / shadowRows.length > 0.38) {
    return { ok: false, reason: "high_malformed_diff_rate" };
  }
  return { ok: true };
}

function buildWarnings(
  inf: Pick<ApplyRankingV8InfluenceOutput, "applied" | "boostsApplied" | "downranksApplied">,
  comparison: RankingV8ComparisonResult,
  moves: number,
): string[] {
  const w: string[] = [];
  if (inf.applied && comparison.summary.stabilityScore < 0.55) {
    w.push("ranking_v8_influence: applied with borderline comparison stability.");
  }
  if (inf.applied && moves > 12) {
    w.push("ranking_v8_influence: unusually high swap participation — review gates.");
  }
  if (inf.applied && inf.boostsApplied + inf.downranksApplied > 8) {
    w.push("ranking_v8_influence: many micro-adjustments in one response.");
  }
  if (inf.applied && comparison.summary.overlapTop5 < 2 && comparison.comparedCount >= 8) {
    w.push("ranking_v8_influence: low top-5 overlap while influence applied — verify shadow blend.");
  }
  return w;
}

/**
 * Apply bounded adjacent swaps in the top zone when quality gates pass.
 * Does not mutate input objects; returns a new array. Live `rankingScore` values are unchanged.
 */
export function applyRankingV8Influence(input: ApplyRankingV8InfluenceInput): ApplyRankingV8InfluenceOutput {
  const base: ApplyRankingV8InfluenceOutput = {
    applied: false,
    monitorOnly: false,
    boostsApplied: 0,
    downranksApplied: 0,
    swapsSkipped: 0,
    observationalWarnings: [],
    reasonSummary: "",
    output: input.liveSorted,
  };

  const g = gatesOk(input.liveSorted, input.shadowRows, input.comparison);
  if (!g.ok) {
    return {
      ...base,
      skippedReason: g.reason,
      reasonSummary: `skipped:${g.reason}`,
      output: input.liveSorted,
    };
  }

  const { comparison, shadowRows } = input;
  const instability = comparison.qualitySignals.orderingInstabilityHint;
  const stability = comparison.summary.stabilityScore;

  if (instability && stability < 0.52) {
    return {
      ...base,
      monitorOnly: true,
      skippedReason: "instability_monitor_only",
      reasonSummary: "monitor_only:instability",
      observationalWarnings: [
        "ranking_v8_influence: instability hint with moderate stability — no reorder (monitor path).",
      ],
      output: input.liveSorted,
    };
  }

  const shadowOrder = deriveShadowOrderFromShadowRows(shadowRows);
  const shadowPos = new Map(shadowOrder.map((id, i) => [id, i]));
  const rowById = new Map(shadowRows.map((r) => [r.listingId, r]));

  const arr = input.liveSorted.map((x) => x);
  const topN = Math.min(RANKING_V8_INFLUENCE_TOP_ZONE, arr.length);
  const swapBudget = new Map<string, number>();

  const allowBoost = !instability || stability >= 0.62;
  const allowCaution = instability && stability >= 0.48;

  let boosts = 0;
  let downranks = 0;
  let skipped = 0;

  function canSwap(id: string): boolean {
    return (swapBudget.get(id) ?? 0) < RANKING_V8_INFLUENCE_MAX_SWAPS_PER_LISTING;
  }
  function recordSwap(idA: string, idB: string): void {
    swapBudget.set(idA, (swapBudget.get(idA) ?? 0) + 1);
    swapBudget.set(idB, (swapBudget.get(idB) ?? 0) + 1);
  }

  for (let pass = 0; pass < INFLUENCE_PASSES; pass++) {
    for (let i = 0; i < topN - 1; i++) {
      const a = arr[i];
      const b = arr[i + 1];
      const idA = a.listing.id;
      const idB = b.listing.id;
      const posA = shadowPos.get(idA) ?? 9999;
      const posB = shadowPos.get(idB) ?? 9999;
      const rA = rowById.get(idA);
      const rB = rowById.get(idB);
      if (!rA || !rB) {
        skipped += 1;
        continue;
      }

      const shadowPrefersBFirst = posB < posA;
      if (!shadowPrefersBFirst) {
        continue;
      }

      let kind: "boost" | "caution" | null = null;
      if (
        allowBoost &&
        rA.shadowScore != null &&
        rB.shadowScore != null &&
        rA.delta != null &&
        rB.delta != null &&
        rB.shadowScore > rA.shadowScore + 2 &&
        rB.delta > rA.delta + 1.5
      ) {
        kind = "boost";
      } else if (
        allowCaution &&
        rA.delta != null &&
        rB.delta != null &&
        rA.delta < -8 &&
        rB.delta > rA.delta + 10
      ) {
        kind = "caution";
      } else {
        skipped += 1;
        continue;
      }

      if (!canSwap(idA) || !canSwap(idB)) {
        skipped += 1;
        continue;
      }

      const tmp = arr[i];
      arr[i] = arr[i + 1];
      arr[i + 1] = tmp;
      recordSwap(idA, idB);
      if (kind === "boost") boosts += 1;
      else downranks += 1;
    }
  }

  const before = input.liveSorted.map((x) => x.listing.id).join(",");
  const after = arr.map((x) => x.listing.id).join(",");
  const applied = before !== after;

  const reasonSummary = [
    `boosts=${boosts}`,
    `downranks=${downranks}`,
    `skipped=${skipped}`,
    `stability=${comparison.summary.stabilityScore.toFixed(2)}`,
    `overlap10=${comparison.summary.overlapTop10}`,
  ].join(" · ");

  const out: ApplyRankingV8InfluenceOutput = {
    applied,
    monitorOnly: false,
    boostsApplied: boosts,
    downranksApplied: downranks,
    swapsSkipped: skipped,
    observationalWarnings: buildWarnings(
      { applied, boostsApplied: boosts, downranksApplied: downranks },
      comparison,
      boosts + downranks,
    ),
    reasonSummary,
    output: arr,
  };

  return out;
}

export function logRankingV8Influence(
  result: ApplyRankingV8InfluenceOutput,
  ctx: {
    influenceEnabled: boolean;
    overlapTop5: number;
    overlapTop10: number;
    avgRankShift: number;
  },
): void {
  logInfo(NS, {
    event: "influence_cycle",
    influenceEnabled: ctx.influenceEnabled,
    applied: result.applied,
    monitorOnly: result.monitorOnly,
    skippedReason: result.skippedReason,
    boosts: result.boostsApplied,
    downranks: result.downranksApplied,
    skipped: result.swapsSkipped,
    overlapTop5: ctx.overlapTop5,
    overlapTop10: ctx.overlapTop10,
    avgRankShift: ctx.avgRankShift,
    reasonSummary: result.reasonSummary,
  });
}
