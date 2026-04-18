/**
 * Advisory recommendation strings — no execution binding.
 */
import type { AiControlCenterSystems } from "@/modules/control-center/ai-control-center.types";
import type {
  GlobalFusionConflict,
  GlobalFusionRecommendation,
  GlobalFusionRecommendationKind,
  GlobalFusionScore,
  GlobalFusionSource,
} from "./global-fusion.types";

function rec(
  kind: GlobalFusionRecommendationKind,
  title: string,
  why: string,
  agreed: GlobalFusionSource[],
  disagreed: GlobalFusionSource[],
  scores: GlobalFusionScore,
): GlobalFusionRecommendation {
  return {
    kind,
    title,
    why,
    systemsAgreed: agreed,
    systemsDisagreed: disagreed,
    confidenceSummary: `fused ~${(scores.fusedConfidence * 100).toFixed(0)}%`,
    riskSummary: `fused ~${(scores.fusedRisk * 100).toFixed(0)}%`,
    evidenceSummary: `evidence ~${(scores.evidenceScore * 100).toFixed(0)}%`,
  };
}

export function buildGlobalFusionRecommendations(
  systems: AiControlCenterSystems,
  conflicts: GlobalFusionConflict[],
  scores: GlobalFusionScore,
): GlobalFusionRecommendation[] {
  const list: GlobalFusionRecommendation[] = [];

  const humanReviewSystems = [
    ...new Set(
      conflicts.filter((c) => c.recommendation === "require_human_review").flatMap((c) => c.systems),
    ),
  ] as GlobalFusionSource[];
  if (humanReviewSystems.length) {
    list.push(
      rec(
        "require_human_review",
        "Review cross-system tension",
        "At least one high-severity advisory conflict suggests human validation before changing posture.",
        [],
        humanReviewSystems,
        scores,
      ),
    );
  }

  const croHealth = systems.cro.healthScore;
  if (croHealth != null && croHealth < 45) {
    list.push(
      rec(
        "fix_funnel_first",
        "Stabilize funnel signals",
        `CRO health ${croHealth} indicates funnel work should precede aggressive acquisition moves.`,
        ["cro"],
        [],
        scores,
      ),
    );
  }

  if (systems.ranking.rollbackAny) {
    list.push(
      rec(
        "expand_ranking_cautiously",
        "Contain ranking rollout risk",
        "Ranking rollback signals present — expand cautiously and verify shadow comparisons.",
        ["ranking"],
        ["ads"],
        scores,
      ),
    );
  }

  if (scores.evidenceScore < 0.35) {
    list.push(
      rec(
        "defer_until_evidence",
        "Wait for stronger evidence",
        "Low fused evidence score — defer broad commitments until subsystem coverage improves.",
        [],
        ["brain", "ads", "cro", "ranking"],
        scores,
      ),
    );
  }

  if (scores.actionability < 0.35 && !list.length) {
    list.push(
      rec(
        "monitor_only",
        "Monitor cross-system posture",
        "Low actionability — observe signals without assuming a single dominant lever.",
        [],
        [],
        scores,
      ),
    );
  }

  if (scores.fusedRisk > 0.65 && scores.fusedConfidence > 0.55) {
    list.push(
      rec(
        "prioritize_stability",
        "Bias toward stability",
        "High fused risk with non-trivial confidence — prefer stabilization over growth acceleration.",
        ["brain", "ranking"],
        ["ads"],
        scores,
      ),
    );
  } else if (scores.fusedConfidence > 0.62 && scores.fusedRisk < 0.42 && conflicts.length === 0) {
    list.push(
      rec(
        "prioritize_growth",
        "Growth opportunity window",
        "Agreement and risk profile allow cautious growth exploration — still human-gated.",
        ["ads"],
        [],
        scores,
      ),
    );
  }

  return list.slice(0, 8).map((r, i) => ({ ...r, id: r.id ?? `gf:rec:${i}` }));
}
