import type { CommandCenterStatusLane, SystemPerformancePanelView } from "./command-center.types";
import { loadSystemPerformancePanel } from "@/modules/outcomes/outcome.service";

function pct(n: number | null) {
  return n == null ? "—" : `${(n * 100).toFixed(1)}%`;
}

function laneForAccuracy(n: number | null): CommandCenterStatusLane {
  if (n == null) return "inactive";
  if (n >= 0.65) return "healthy";
  if (n >= 0.45) return "attention";
  return "urgent";
}

/**
 * Server-side payload for the System Performance strip (ADMIN; empty when off or low data).
 */
export async function loadSystemPerformanceSection(): Promise<SystemPerformancePanelView> {
  const s = await loadSystemPerformancePanel();
  const hasSignal =
    s.predictionAccuracy != null ||
    s.conversionRate != null ||
    s.dealSuccessRate != null ||
    s.noShowRate != null ||
    s.disputeRate != null;
  if (!hasSignal) {
    return {
      title: "System performance",
      headline: "Outcome loop is warming up — as leads, visits, and checkout events accrue, prediction accuracy and drift show here.",
      rows: [
        { label: "Prediction accuracy", value: "—", lane: "inactive", hint: "Enable FEATURE_LECIPM_OUTCOME_LOOP_V1 and apply migration for log hooks." },
      ],
      wins: [],
      misses: [],
      seriesHint: s.improvementHint,
      series: s.improvementSeries.slice(-7),
      learningQueue: s.learningQueue,
      generatedAt: s.generatedAt,
    };
  }
  return {
    title: "System performance",
    headline: s.improvementHint,
    rows: [
      {
        label: "Prediction accuracy",
        value: pct(s.predictionAccuracy),
        hint: "Deal intelligence · trust · scenario autopilot (aggregated)",
        lane: laneForAccuracy(s.predictionAccuracy),
      },
      { label: "Conversion (lead outcomes)", value: pct(s.conversionRate), lane: s.conversionRate != null && s.conversionRate < 0.2 ? "urgent" : "healthy" },
      { label: "Deal success (events)", value: pct(s.dealSuccessRate), lane: "healthy" },
      { label: "No-show rate", value: pct(s.noShowRate), lane: s.noShowRate != null && s.noShowRate > 0.2 ? "attention" : "healthy" },
      { label: "Dispute share (event proxy)", value: pct(s.disputeRate), lane: s.disputeRate != null && s.disputeRate > 0.12 ? "urgent" : "healthy" },
      { label: "Model drift (mean |Δ|)", value: s.drift == null ? "—" : s.drift.toFixed(3), lane: s.drift != null && s.drift > 0.25 ? "attention" : "healthy" },
    ],
    wins: s.biggestWins.map((w) => ({ id: w.id, title: w.title, detail: w.detail, at: w.at })),
    misses: s.biggestMisses.map((m) => ({ id: m.id, title: m.title, detail: m.detail, at: m.at })),
    seriesHint: s.improvementHint,
    series: s.improvementSeries.slice(-7),
    learningQueue: s.learningQueue,
    generatedAt: s.generatedAt,
  };
}
