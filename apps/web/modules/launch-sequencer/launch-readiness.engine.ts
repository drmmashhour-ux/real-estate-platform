import type { LaunchCandidateMarket, LaunchReadinessLabel, LaunchReadinessScore } from "./launch-sequencer.types";
import { launchSequencerLog } from "./launch-sequencer.logger";

function clamp100(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

function labelFromScore(score: number): LaunchReadinessLabel {
  if (score < 35) return "not_ready";
  if (score < 55) return "pilot_ready";
  if (score < 75) return "limited_launch_ready";
  return "launch_ready";
}

const MISSING_DIM_FALLBACK = 32;

/**
 * Conservative weighted readiness from candidate dimensions. Missing fields use low priors.
 * Never throws.
 */
export function computeLaunchReadiness(candidate: LaunchCandidateMarket): LaunchReadinessScore {
  try {
    const rationale: string[] = [];
    const dims: { key: string; value: number; weight: number }[] = [];

    const opp = candidate.opportunityScore;
    const loc = candidate.localizationReadiness;
    const comp = candidate.complianceReadiness;
    const staff = candidate.staffingReadiness;
    const prod = candidate.productReadiness;
    const dataConf = candidate.dataConfidence;
    const complexity = candidate.operationalComplexity;

    const use = (key: string, v: number | undefined, weight: number) => {
      if (v == null || !Number.isFinite(v)) {
        dims.push({ key, value: MISSING_DIM_FALLBACK, weight });
        rationale.push(`${key}: incomplete market data — applied conservative prior (${MISSING_DIM_FALLBACK}).`);
      } else {
        dims.push({ key, value: clamp100(v), weight });
      }
    };

    use("expansion_opportunity", opp, 0.18);
    use("localization_readiness", loc, 0.18);
    use("compliance_readiness", comp, 0.22);
    use("staffing_readiness", staff, 0.12);
    use("product_readiness", prod, 0.15);
    use("data_confidence", dataConf, 0.15);

    let complexityPenalty = 0;
    if (complexity == null || !Number.isFinite(complexity)) {
      complexityPenalty = 8;
      rationale.push("operational_complexity: unknown — small execution penalty applied.");
    } else {
      complexityPenalty = clamp100(complexity) * 0.12;
    }

    let weighted = 0;
    let wsum = 0;
    for (const d of dims) {
      weighted += d.value * d.weight;
      wsum += d.weight;
    }
    const base = wsum > 0 ? weighted / wsum : MISSING_DIM_FALLBACK;
    const score = clamp100(base - complexityPenalty);
    const label = labelFromScore(score);

    rationale.push(
      `Scenario-weighted readiness ${score.toFixed(0)}/100 → ${label} (bands: <35 not_ready, 35–54 pilot, 55–74 limited, 75+ full).`,
    );
    rationale.push(
      "This score does not bypass compliance or localization gates — it only prioritizes conservative execution order.",
    );
    if (candidate.scenarioNote) {
      rationale.push(`Scenario context: ${candidate.scenarioNote}`);
    }

    launchSequencerLog.info("launch_readiness_computed", { marketKey: candidate.marketKey, score, label });
    return { score, label, rationale };
  } catch {
    launchSequencerLog.warn("launch_readiness_computed_failed", { marketKey: candidate.marketKey });
    return {
      score: 28,
      label: "not_ready",
      rationale: [
        "Readiness computation fell back to a conservative default.",
        "Treat as not_ready until validated market pack and counsel review are recorded.",
      ],
    };
  }
}
