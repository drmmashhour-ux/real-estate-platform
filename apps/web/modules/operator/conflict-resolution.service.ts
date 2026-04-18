import type { AssistantRecommendation, RecommendationConflict, RecommendationSource } from "./operator.types";

const SCALE = new Set(["SCALE_CAMPAIGN"]);
const PAUSE = new Set(["PAUSE_CAMPAIGN"]);
const BOOST = new Set(["BOOST_LISTING"]);
const PRICE_UP = new Set(["RECOMMEND_PRICE_CHANGE"]);

function scoreRec(r: AssistantRecommendation): number {
  let s = r.confidenceScore * 40;
  const ev = r.evidenceQuality;
  if (ev === "HIGH") s += 25;
  else if (ev === "MEDIUM") s += 12;
  if (r.source === "PROFIT") s += 15;
  if (r.source === "AB_TEST" && r.actionType === "PROMOTE_EXPERIMENT_WINNER") s += 10;
  if (r.source === "MARKETPLACE" && r.blockers?.length) s -= 20;
  return s;
}

/**
 * Priority between two recommendations — returns the one that should win for ordering, or null if human review.
 */
export function resolveConflictPriority(
  a: AssistantRecommendation,
  b: AssistantRecommendation,
): AssistantRecommendation | null {
  const sa = scoreRec(a);
  const sb = scoreRec(b);
  if (Math.abs(sa - sb) < 8) return null;
  return sa >= sb ? a : b;
}

function severityFor(actions: string[], sources: RecommendationSource[]): "LOW" | "MEDIUM" | "HIGH" {
  if (sources.includes("MARKETPLACE") && sources.includes("ADS")) return "HIGH";
  if (actions.some((x) => SCALE.has(x as never) || PAUSE.has(x as never))) return "MEDIUM";
  return "LOW";
}

export function detectRecommendationConflicts(recommendations: AssistantRecommendation[]): RecommendationConflict[] {
  const byTarget = new Map<string | "none", AssistantRecommendation[]>();
  for (const r of recommendations) {
    const key = (r.targetId ?? "none") as string | "none";
    if (!byTarget.has(key)) byTarget.set(key, []);
    byTarget.get(key)!.push(r);
  }

  const out: RecommendationConflict[] = [];

  for (const [targetKey, group] of byTarget) {
    if (group.length < 2) continue;
    const sources = [...new Set(group.map((g) => g.source))];

    const hasScale = group.some((g) => SCALE.has(g.actionType));
    const hasPause = group.some((g) => PAUSE.has(g.actionType));
    if (hasScale && hasPause) {
      out.push({
        targetId: targetKey === "none" ? null : targetKey,
        actionTypes: ["SCALE_CAMPAIGN", "PAUSE_CAMPAIGN"],
        sources,
        severity: severityFor(["SCALE_CAMPAIGN", "PAUSE_CAMPAIGN"], sources),
        reason: "Scale and pause both suggested for the same target — reconcile in Ads Manager manually.",
        createdAt: new Date().toISOString(),
      });
    }

    const hasBoost = group.some((g) => BOOST.has(g.actionType));
    const hasReview = group.some((g) => g.actionType === "REVIEW_LISTING" || g.blockers?.length);
    if (hasBoost && hasReview) {
      out.push({
        targetId: targetKey === "none" ? null : targetKey,
        actionTypes: ["BOOST_LISTING", "REVIEW_LISTING"],
        sources,
        severity: "HIGH",
        reason: "Boost conflicts with trust/fraud review — do not boost until review clears.",
        createdAt: new Date().toISOString(),
      });
    }

    const priceRecs = group.filter((g) => PRICE_UP.has(g.actionType));
    if (priceRecs.length >= 2) {
      const m = priceRecs.map((p) => p.metrics?.adjustmentPercent as number | undefined).filter((x) => x != null);
      if (m.length >= 2 && new Set(m.map(Math.sign)).size > 1) {
        out.push({
          targetId: targetKey === "none" ? null : targetKey,
          actionTypes: ["RECOMMEND_PRICE_CHANGE", "RECOMMEND_PRICE_CHANGE"],
          sources,
          severity: "MEDIUM",
          reason: "Contradictory price guidance — human must choose a single direction.",
          createdAt: new Date().toISOString(),
        });
      }
    }

    const promote = group.find((g) => g.actionType === "PROMOTE_EXPERIMENT_WINNER");
    const croRotate = group.find((g) => g.actionType === "UPDATE_CTA_PRIORITY" && g.source === "CRO");
    if (promote && croRotate) {
      out.push({
        targetId: targetKey === "none" ? null : targetKey,
        actionTypes: ["PROMOTE_EXPERIMENT_WINNER", "UPDATE_CTA_PRIORITY"],
        sources,
        severity: "LOW",
        reason: "A/B promotion may override CTA rotation — confirm winner before changing hero copy.",
        createdAt: new Date().toISOString(),
      });
    }
  }

  return out;
}
