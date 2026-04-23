import { TRAINING_SCENARIOS } from "@/modules/training-scenarios/training-scenarios.data";
import type { TeamSession } from "@/modules/team-training/team.types";
import type { CallReplayAnalysisResult } from "@/modules/call-replay/call-replay.types";

import {
  appendAssignment,
  ingestReplayWeakSignals,
  updateSalesProfileFromTraining,
  getSalesProfile,
} from "./ai-sales-profile.service";
import { generateCoachingRecommendations, persistRecommendations } from "./ai-sales-recommendation.service";
import { analyzeCoachingSignals } from "./ai-sales-coaching.service";
import { getStoredForecast } from "./ai-sales-forecast.service";
import { generateStrategySuggestions, listPreCallWatchouts } from "./ai-sales-strategy.service";

/** After `completeSessionResults`, sync scores into AI Sales profiles (Training Hub bridge). */
export function syncAiSalesProfilesFromTrainingSession(session: TeamSession): void {
  const scenarioMeta = TRAINING_SCENARIOS.find((s) => s.id === session.scenarioId);
  for (const r of session.results) {
    updateSalesProfileFromTraining(r.memberId, {
      scenarioId: session.scenarioId ?? r.scenarioId ?? "unknown-session",
      avgScore: r.avgScore,
      controlScore: r.controlScore,
      closingScore: Math.min(100, Math.max(0, r.closingRate * 100)),
      won: r.won,
      personality: scenarioMeta?.personality,
      scenarioAudience: scenarioMeta?.type,
      difficulty: scenarioMeta?.difficulty,
    });
    const p = getSalesProfile(r.memberId);
    const analysis = analyzeCoachingSignals(p);
    persistRecommendations(r.memberId, generateCoachingRecommendations(p, analysis));
  }
}

/** Call Replay Analyzer → weak moment signals on the sales profile. */
export function ingestCallReplayAnalysisForUser(userId: string, analysis: CallReplayAnalysisResult): void {
  const signals = [
    ...analysis.mistakes,
    ...analysis.events.map((e) => `${e.kind}:${e.message}`),
  ];
  ingestReplayWeakSignals(userId, signals);
  const p = getSalesProfile(userId);
  const coaching = analyzeCoachingSignals(p);
  persistRecommendations(userId, generateCoachingRecommendations(p, coaching));
}

/** Live Call Assistant / Call Center — pre-call brief (human reads; never auto-sent to client). */
export function buildLiveCallPrecallBrief(userId: string) {
  const p = getSalesProfile(userId);
  return {
    watchouts: listPreCallWatchouts(p),
    strategies: generateStrategySuggestions(p).slice(0, 3),
    explainability:
      "Generated from aggregated profile + objections + control metrics — manager can override.",
  };
}

/** Post-call coaching one-pager text for CRM notes (assistant layer). Pure — no intel refresh side effects. */
export function buildPostCallCoachingSummary(userId: string): string {
  const p = getSalesProfile(userId);
  const coaching = analyzeCoachingSignals(p);
  const recs = generateCoachingRecommendations(p, coaching);
  const strategies = generateStrategySuggestions(p);
  const fc = getStoredForecast(userId);
  const topRec = recs[0];
  const topStr = strategies[0];
  const lines = [
    `[AI Sales Manager — coaching note]`,
    fc ? `Forecast context: ${fc.current.narrative}` : "Forecast not cached — tap refresh intelligence once.",
    topRec ? `Priority: ${topRec.title} — ${topRec.reason}` : "",
    topStr ? `Tactic: ${topStr.title} — ${topStr.exampleLine}` : "",
  ];
  return lines.filter(Boolean).join("\n");
}

/** Auto-assign next scenarios (stores assignment record; human still owns delivery). */
export { rankCoachingByRevenueImpact } from "@/modules/revenue-predictor/revenue-predictor-team.service";

export function assignRecommendedScenarios(userId: string, coachNote?: string): ReturnType<typeof appendAssignment> {
  const p = getSalesProfile(userId);
  const analysis = analyzeCoachingSignals(p);
  const recs = generateCoachingRecommendations(p, analysis);
  const ids = [...new Set(recs.flatMap((r) => r.suggestedScenarioIds))].slice(0, 4);
  persistRecommendations(userId, recs);
  return appendAssignment({
    userId,
    scenarioIds: ids,
    note: coachNote ?? "Auto-assigned from AI Sales Manager recommendation engine.",
    source: "ai_sales_manager",
  });
}
