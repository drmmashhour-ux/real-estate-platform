/**
 * Deterministic bounded estimates — labels are advisory; not factual outcomes.
 */

import type {
  GrowthSimulationBaseline,
  GrowthSimulationConfidence,
  GrowthSimulationEstimate,
  GrowthSimulationScenarioInput,
} from "./growth-simulation.types";

const MAX_DELTA_PCT = 22;

function clampPct(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(MAX_DELTA_PCT, Math.max(-MAX_DELTA_PCT, Math.round(n)));
}

function conversionBaselineIndex(ads: GrowthSimulationBaseline["adsPerformance"]): number {
  if (ads === "STRONG") return 72;
  if (ads === "OK") return 58;
  return 42;
}

function pipelineIndex(baseline: GrowthSimulationBaseline): number {
  const s = baseline.executiveStatus;
  if (s === "strong") return 84;
  if (s === "healthy") return 68;
  if (s === "weak") return 38;
  return 52;
}

export type GrowthSimulationEngineOutput = {
  estimates: GrowthSimulationEstimate[];
  upsideSummary: string;
  downsideSummary: string;
  confidence: GrowthSimulationConfidence;
  notes: string[];
};

export function simulateGrowthScenario(
  scenario: GrowthSimulationScenarioInput,
  baseline: GrowthSimulationBaseline,
): GrowthSimulationEngineOutput {
  const notes: string[] = ["All figures are directional estimates for planning — not predictions of actual results."];
  const leadsBase = Math.max(1, baseline.leadsTotal || baseline.leadsTodayEarly || 1);
  const cvrIdx = conversionBaselineIndex(baseline.adsPerformance);
  const pipeIdx = pipelineIndex(baseline);
  const due = baseline.dueNow;
  const hot = baseline.hotLeads;

  let conf: GrowthSimulationConfidence = "medium";
  if (baseline.missingDataWarnings.length >= 2 || baseline.adsPerformance === "WEAK") {
    conf = baseline.missingDataWarnings.length >= 3 ? "low" : "medium";
  }
  if (baseline.adsPerformance === "STRONG" && baseline.missingDataWarnings.length === 0) {
    conf = "high";
  }

  const estimates: GrowthSimulationEstimate[] = [];

  const pushEst = (
    metric: GrowthSimulationEstimate["metric"],
    baselineVal: number | undefined,
    deltaPct: number,
    rationale: string,
    estConf: GrowthSimulationConfidence,
  ) => {
    const d = clampPct(deltaPct);
    const ev = baselineVal != null ? Math.round(baselineVal * (1 + d / 100)) : undefined;
    estimates.push({
      metric,
      baseline: baselineVal,
      estimatedDeltaPct: d,
      estimatedValue: ev,
      confidence: estConf,
      rationale,
    });
  };

  switch (scenario.type) {
    case "increase_acquisition": {
      let leadDelta = 8;
      if (baseline.adsPerformance === "WEAK") {
        leadDelta = 4;
        notes.push("Conversion band is weak — acquisition upside capped in this estimate.");
        conf = conf === "high" ? "medium" : conf;
      }
      pushEst("leads", leadsBase, leadDelta, "Estimated lead volume change if traffic/campaign focus increases modestly.", conf);
      pushEst(
        "conversion",
        cvrIdx,
        baseline.adsPerformance === "WEAK" ? 2 : 3,
        "Secondary effect on conversion if traffic quality holds — conservative.",
        "low",
      );
      return {
        estimates,
        upsideSummary: "Modest lead-volume upside if acquisition quality is maintained.",
        downsideSummary: "If conversion stays weak, incremental traffic may not improve pipeline quality.",
        confidence: conf,
        notes,
      };
    }
    case "fix_conversion": {
      const convDelta = baseline.adsPerformance === "WEAK" ? 14 : 8;
      pushEst("conversion", cvrIdx, convDelta, "Estimated improvement to conversion index if landing/form friction is reduced.", conf);
      pushEst("leads", leadsBase, baseline.adsPerformance === "WEAK" ? 5 : 3, "Some lead lift as more visitors complete key steps.", "medium");
      return {
        estimates,
        upsideSummary: "Stronger relative upside when the funnel band is currently weak.",
        downsideSummary: "Benefits depend on consistent measurement and human review of changes.",
        confidence: conf,
        notes,
      };
    }
    case "improve_followup": {
      const respDelta = Math.min(18, 10 + Math.min(8, due));
      pushEst(
        "response_rate",
        55,
        respDelta,
        "Estimated internal response effectiveness if due backlog is cleared faster (human execution).",
        conf,
      );
      pushEst("pipeline_health", pipeIdx, hot >= 3 || due >= 3 ? 12 : 7, "Pipeline health index may rise with faster follow-up on hot/due items.", conf);
      const outConf: GrowthSimulationConfidence = due + hot === 0 ? "low" : conf;
      return {
        estimates,
        upsideSummary: "Higher upside when due-now or hot-lead load is elevated.",
        downsideSummary: "Limited upside if lead volume is very low regardless of speed.",
        confidence: outConf,
        notes,
      };
    }
    case "improve_content": {
      pushEst("conversion", cvrIdx, 6, "Estimated conversion index lift from clearer copy (bounded).", "medium");
      pushEst("leads", leadsBase, 4, "Minor lead lift from improved relevance signals — not guaranteed.", "low");
      return {
        estimates,
        upsideSummary: "Incremental gains; often slower than funnel or follow-up fixes.",
        downsideSummary: "Weak channel performance may limit content impact — validate with data.",
        confidence: "medium",
        notes,
      };
    }
    case "mixed_strategy":
    default: {
      pushEst("leads", leadsBase, 5, "Small composite change to lead volume.", "low");
      pushEst("conversion", cvrIdx, 6, "Small composite change to conversion index.", "low");
      pushEst("pipeline_health", pipeIdx, 6, "Modest composite pipeline health change.", "low");
      notes.push("Mixed programs add coordination overhead — upside is intentionally capped.");
      return {
        estimates,
        upsideSummary: "Balanced but modest upside spread across levers.",
        downsideSummary: "Execution complexity and partial effects increase variance versus a single focus.",
        confidence: "low",
        notes,
      };
    }
  }
}
