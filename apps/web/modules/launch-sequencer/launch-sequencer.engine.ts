import { computeLaunchReadiness } from "./launch-readiness.engine";
import { mapLaunchDependencies } from "./dependency-mapper.service";
import { planMarketFeatureSubset } from "./feature-subset-planner.service";
import { selectLaunchMode } from "./launch-mode.service";
import { computeLaunchRiskProfile } from "./launch-risk.engine";
import { buildLaunchCandidateMarkets } from "./launch-input-aggregation.service";
import type {
  LaunchCandidateMarket,
  LaunchSequenceRecommendation,
  LaunchSequencerOutput,
} from "./launch-sequencer.types";
import { launchSequencerLog } from "./launch-sequencer.logger";

function sortKey(
  c: LaunchCandidateMarket,
  readinessScore: number,
  riskOverall: "low" | "medium" | "high",
  blockingN: number,
): number {
  const opp = c.opportunityScore ?? 40;
  const dataConf = c.dataConfidence ?? 35;
  const complexity = c.operationalComplexity ?? 55;

  let riskPenalty = riskOverall === "high" ? 22 : riskOverall === "medium" ? 10 : 0;
  const blockerPenalty = blockingN * 9;
  const complexityPenalty = Math.max(0, complexity - 50) * 0.18;

  /** Penalize high theoretical upside when readiness lags (avoid land-grab ordering). */
  const upsideGap = Math.max(0, opp - readinessScore - 12);
  const opportunityDiscipline = upsideGap * 0.22;

  return (
    readinessScore * 0.42 +
    opp * 0.18 +
    dataConf * 0.14 -
    riskPenalty -
    blockerPenalty -
    complexityPenalty -
    opportunityDiscipline
  );
}

function buildRecommendation(candidate: LaunchCandidateMarket): LaunchSequenceRecommendation {
  const readiness = computeLaunchReadiness(candidate);
  const dependencies = mapLaunchDependencies(candidate.marketKey, candidate);
  const featureSubset = planMarketFeatureSubset(candidate.marketKey, readiness, dependencies);
  const { launchMode, rationale: modeRationale } = selectLaunchMode(readiness, dependencies, featureSubset);
  const riskProfile = computeLaunchRiskProfile(candidate.marketKey, readiness, dependencies);

  const rationale: string[] = [
    `Sequencing scenario for ${candidate.marketKey}: readiness ${readiness.score}/100 (${readiness.label}).`,
    ...readiness.rationale.slice(0, 2),
    ...modeRationale,
    `Risk posture: ${riskProfile.overallRisk} — ${riskProfile.risks[0]?.label ?? "see risk panel"}.`,
    "Ordering favors executable, conservative rollout over uncapped upside when data is thin.",
  ];

  return {
    marketKey: candidate.marketKey,
    priorityRank: 0,
    launchMode,
    readiness,
    dependencies,
    featureSubset,
    riskProfile,
    rationale,
  };
}

/**
 * Generate ordered launch sequence from aggregated candidates. Never throws.
 */
export function generateLaunchSequence(): LaunchSequencerOutput {
  try {
    const candidates = buildLaunchCandidateMarkets();
    if (candidates.length === 0) {
      launchSequencerLog.warn("launch_sequence_generated", { count: 0 });
      return {
        recommendations: [],
        summary: ["No candidate markets available — expansion registry may be empty in this environment."],
        topBlockers: ["Missing candidate market data"],
        generatedAt: new Date().toISOString(),
        dataQualityNote: "Empty input set — conservative empty plan.",
      };
    }

    const enriched = candidates.map((c) => {
      const rec = buildRecommendation(c);
      const blockingN = rec.dependencies.filter((d) => d.blocking).length;
      const sortScore = sortKey(c, rec.readiness.score, rec.riskProfile.overallRisk, blockingN);
      return { rec, sortScore, c };
    });

    enriched.sort((a, b) => b.sortScore - a.sortScore);

    const recommendations: LaunchSequenceRecommendation[] = enriched.map((e, i) => ({
      ...e.rec,
      priorityRank: i + 1,
    }));

    const top = recommendations[0];
    const blockerKeys = recommendations.flatMap((r) =>
      r.dependencies.filter((d) => d.blocking).map((d) => `${r.marketKey} · ${d.title}`),
    );

    const summary: string[] = [
      `Scenario-based plan for ${recommendations.length} markets (not legal clearance).`,
      top ?
        `Highest-priority execution slot under conservative rules: ${top.marketKey} (${top.launchMode}, readiness ${top.readiness.score}).`
      : "",
      "High-opportunity / low-readiness markets are penalized in rank to avoid premature rollout.",
      "Validate compliance and localization outside this tool — gates are not bypassed.",
    ].filter(Boolean);

    launchSequencerLog.info("launch_sequence_generated", { count: recommendations.length });

    return {
      recommendations,
      summary,
      topPriorityMarket: top?.marketKey,
      topBlockers: [...new Set(blockerKeys)].slice(0, 8),
      generatedAt: new Date().toISOString(),
      dataQualityNote:
        candidates.some((c) => (c.dataConfidence ?? 0) < 45) ?
          "Some markets use low-confidence proxies — treat ordering as advisory."
        : "Inputs appear moderately complete; still confirm with live ops data.",
    };
  } catch {
    launchSequencerLog.warn("launch_sequence_generated_failed", {});
    return {
      recommendations: [],
      summary: ["Launch sequence unavailable — conservative fallback engaged."],
      topBlockers: ["Sequencer error"],
      generatedAt: new Date().toISOString(),
      dataQualityNote: "Error path — no reliance on empty recommendations for go-live.",
    };
  }
}
