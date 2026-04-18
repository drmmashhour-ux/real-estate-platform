/**
 * In-process observability for Growth Fusion — logs only; no external I/O.
 */

import type { GrowthFusionRawSnapshot } from "./growth-fusion-snapshot.service";
import type { GrowthFusionAction, GrowthFusionSummary } from "./growth-fusion.types";

export type GrowthFusionMonitoringCounters = {
  fusionRuns: number;
  weakStatusCount: number;
  moderateStatusCount: number;
  strongStatusCount: number;
  sourceCoverage: Record<"leads" | "ads" | "cro" | "content" | "autopilot", number>;
  actionsGenerated: number;
  confidenceSum: number;
  confidenceSamples: number;
  missingSourceWarnings: number;
};

const counters: GrowthFusionMonitoringCounters = {
  fusionRuns: 0,
  weakStatusCount: 0,
  moderateStatusCount: 0,
  strongStatusCount: 0,
  sourceCoverage: { leads: 0, ads: 0, cro: 0, content: 0, autopilot: 0 },
  actionsGenerated: 0,
  confidenceSum: 0,
  confidenceSamples: 0,
  missingSourceWarnings: 0,
};

export function getGrowthFusionMonitoringCounters(): GrowthFusionMonitoringCounters {
  return { ...counters, sourceCoverage: { ...counters.sourceCoverage } };
}

/** Vitest-only reset. */
export function resetGrowthFusionMonitoringForTests(): void {
  counters.fusionRuns = 0;
  counters.weakStatusCount = 0;
  counters.moderateStatusCount = 0;
  counters.strongStatusCount = 0;
  counters.sourceCoverage = { leads: 0, ads: 0, cro: 0, content: 0, autopilot: 0 };
  counters.actionsGenerated = 0;
  counters.confidenceSum = 0;
  counters.confidenceSamples = 0;
  counters.missingSourceWarnings = 0;
}

export function recordGrowthFusionRun(input: {
  snapshot: GrowthFusionRawSnapshot;
  summary: GrowthFusionSummary;
  actions: GrowthFusionAction[];
}): void {
  const { snapshot, summary, actions } = input;
  counters.fusionRuns += 1;
  if (summary.status === "weak") counters.weakStatusCount += 1;
  else if (summary.status === "moderate") counters.moderateStatusCount += 1;
  else counters.strongStatusCount += 1;

  for (const k of ["leads", "ads", "cro", "content", "autopilot"] as const) {
    counters.sourceCoverage[k] += summary.grouped[k].length;
  }
  counters.actionsGenerated += actions.length;
  counters.confidenceSum += summary.confidence;
  counters.confidenceSamples += 1;

  const missing: string[] = [];
  if (snapshot.warnings.some((w) => w.includes("leads"))) {
    missing.push("leads");
    counters.missingSourceWarnings += 1;
  }
  if (snapshot.warnings.some((w) => w.includes("ads"))) {
    missing.push("ads");
    counters.missingSourceWarnings += 1;
  }

  const top = actions[0];
  const avgConf =
    counters.confidenceSamples > 0 ? counters.confidenceSum / counters.confidenceSamples : 0;

  console.log(
    JSON.stringify({
      tag: "[growth:fusion]",
      phase: "completed",
      status: summary.status,
      confidence: summary.confidence,
      signalCount: summary.signals.length,
      actionsCount: actions.length,
      topActionId: top?.id ?? null,
      topActionTitle: top?.title ?? null,
      warnings: snapshot.warnings,
      missingSourceHints: missing,
      confidenceRollingAvg: Number(avgConf.toFixed(3)),
    }),
  );
}

export function logGrowthFusionRunStarted(): void {
  console.log(JSON.stringify({ tag: "[growth:fusion]", phase: "started" }));
}
