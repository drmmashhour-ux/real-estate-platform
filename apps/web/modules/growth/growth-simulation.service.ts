/**
 * Growth simulation bundle — advisory what-if only; no execution or data mutation.
 */

import { growthSimulationFlags } from "@/config/feature-flags";
import { buildGrowthSimulationBaseline } from "./growth-simulation-baseline.service";
import { buildGrowthSimulationScenarios } from "./growth-simulation-scenarios.service";
import { simulateGrowthScenario } from "./growth-simulation-engine.service";
import { evaluateGrowthSimulationRisks } from "./growth-simulation-risk.service";
import { buildGrowthSimulationRecommendation } from "./growth-simulation-recommendation.service";
import {
  logGrowthSimulationBuildStarted,
  recordGrowthSimulationBuild,
} from "./growth-simulation-monitoring.service";
import type {
  GrowthSimulationBaseline,
  GrowthSimulationBundle,
  GrowthSimulationResult,
  GrowthSimulationScenarioInput,
} from "./growth-simulation.types";

/**
 * Pure assembly for tests — no I/O.
 */
export function assembleGrowthSimulationBundle(
  baseline: GrowthSimulationBaseline,
  scenarioInputs: GrowthSimulationScenarioInput[],
): GrowthSimulationBundle {
  const createdAt = new Date().toISOString();
  const results: GrowthSimulationResult[] = [];

  for (const s of scenarioInputs) {
    const engineOut = simulateGrowthScenario(s, baseline);
    const risks = evaluateGrowthSimulationRisks(s, baseline);
    const recommendation = buildGrowthSimulationRecommendation({
      estimates: engineOut.estimates,
      risks,
      confidence: engineOut.confidence,
    });
    results.push({
      scenarioId: s.id,
      title: s.title,
      estimates: engineOut.estimates,
      risks,
      upsideSummary: engineOut.upsideSummary,
      downsideSummary: engineOut.downsideSummary,
      recommendation,
      confidence: engineOut.confidence,
      notes: engineOut.notes,
      createdAt,
    });
  }

  return {
    baselineSummary: {
      leads: baseline.leadsTotal,
      topCampaign: baseline.topCampaign,
      status: baseline.executiveStatus,
    },
    scenarios: results,
    createdAt,
  };
}

export async function buildGrowthSimulationBundle(): Promise<GrowthSimulationBundle | null> {
  if (!growthSimulationFlags.growthSimulationV1) {
    return null;
  }

  logGrowthSimulationBuildStarted();
  const baseline = await buildGrowthSimulationBaseline();
  const scenarioInputs = buildGrowthSimulationScenarios();
  const bundle = assembleGrowthSimulationBundle(baseline, scenarioInputs);

  let consider = 0;
  let caution = 0;
  let defer = 0;
  let lowConf = 0;
  for (const r of bundle.scenarios) {
    if (r.recommendation === "consider") consider += 1;
    else if (r.recommendation === "caution") caution += 1;
    else defer += 1;
    if (r.confidence === "low") lowConf += 1;
  }

  const topRec = bundle.scenarios[0]?.recommendation;

  recordGrowthSimulationBuild({
    baselineStatus: baseline.executiveStatus,
    scenarioCount: bundle.scenarios.length,
    topRecommendation: topRec,
    missingDataWarningCount: baseline.missingDataWarnings.length,
    lowConfidenceScenarioCount: lowConf,
    consider,
    caution,
    defer,
  });

  return bundle;
}
