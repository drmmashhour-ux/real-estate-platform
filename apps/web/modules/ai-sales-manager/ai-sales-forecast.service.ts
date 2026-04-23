import type { PerformanceForecast, SalesProfile } from "./ai-sales-manager.types";
import { loadAiSalesStore, saveAiSalesStore } from "./ai-sales-manager-storage";
import { analyzeCoachingSignals } from "./ai-sales-coaching.service";

function band(
  profile: SalesProfile,
  upliftDemo: number,
  upliftClose: number,
  conf: number,
  narrative: string,
  risk: string[],
): PerformanceForecast["current"] {
  const tc = Math.max(1, profile.totalCalls);
  const baseDemo = profile.demosBooked / tc;
  const baseClose =
    profile.closesWon + profile.closesLost > 0 ? profile.closesWon / (profile.closesWon + profile.closesLost) : 0.5;
  return {
    demoBookingRate: Math.min(0.45, Math.max(0.05, baseDemo + upliftDemo)),
    closeRate: Math.min(0.65, Math.max(0.05, baseClose + upliftClose)),
    confidence: Math.min(0.85, Math.max(0.22, conf)),
    narrative,
    riskFactors: risk.slice(0, 5),
  };
}

/**
 * Probabilistic, cautious forecasts — transparency over false precision.
 */
export function forecastPerformance(profile: SalesProfile): PerformanceForecast {
  const demoRate = profile.totalCalls > 0 ? profile.demosBooked / profile.totalCalls : 0;
  const denom = profile.closesWon + profile.closesLost;
  const closeRate = denom > 0 ? profile.closesWon / denom : 0.35;

  const samplePenalty = Math.min(1, profile.totalCalls / 25) * Math.min(1, profile.trainingSessionCount / 15);
  const confidence = 0.25 + 0.55 * samplePenalty;

  const risks: string[] = [];
  if (profile.totalCalls < 8) risks.push("Low live-call sample — demo rate noisy.");
  if (profile.trainingSessionCount < 5) risks.push("Limited lab coverage — forecasts lean on sparse practice.");
  if (profile.improvementTrend === "down") risks.push("Rolling scores trending down — execution risk elevated.");
  if (demoRate < 0.15 && profile.totalCalls >= 6) risks.push("Demo/book conversion below typical band for volume.");

  const analysis = analyzeCoachingSignals(profile);
  const coachingLift =
    analysis.weaknesses.length >= 3 ? 0.04 : analysis.weaknesses.length >= 1 ? 0.025 : 0.012;

  const currentNarrative = `Observed demo/book ~${Math.round(demoRate * 100)}% over ${profile.totalCalls} logs; close ~${Math.round(closeRate * 100)}% on tracked outcomes. Confidence capped by sample depth.`;

  const bestNarrative = `Upside if top objections are neutralized and control questions land in first minute — demo/book could approach ~${Math.round(Math.min(0.42, demoRate + 0.06) * 100)}% in similar pipeline quality (optimistic).`;

  const coachingNarrative = `If coaching priorities (${analysis.trainingPriorityAreas.slice(0, 2).join("; ") || "general discipline"}) improve measurably in lab + live logging, demo/book may lift ~${Math.round(coachingLift * 100)}–${Math.round(coachingLift * 100 + 4)} pts vs baseline — still contingent on lead quality.`;

  const fc: PerformanceForecast = {
    userId: profile.userId,
    current: band(profile, 0, 0, confidence, currentNarrative, risks),
    bestCase: band(profile, 0.06, 0.08, confidence * 0.92, bestNarrative, [...risks, "Assumes pipeline quality unchanged"]),
    ifCoachingFollowed: band(profile, coachingLift, coachingLift * 0.8, confidence * 0.88, coachingNarrative, risks),
    generatedAtIso: new Date().toISOString(),
  };

  const store = loadAiSalesStore();
  store.forecastsByUser[profile.userId] = fc;
  saveAiSalesStore(store);

  return fc;
}

export function getStoredForecast(userId: string): PerformanceForecast | undefined {
  return loadAiSalesStore().forecastsByUser[userId];
}
