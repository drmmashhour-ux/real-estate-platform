import type { CoachingAnalysis, SalesProfile } from "./ai-sales-manager.types";
import type { ScenarioPersonality } from "@/modules/training-scenarios/training-scenarios.types";

const LONG_MONOLOGUE_HINTS = /\b(long|verbose|monologue|rambling)\b/i;
const WEAK_CLOSE_HINTS = /\b(weak close|hedge|hope to|maybe)\b/i;

/**
 * Explainable pattern detection from profile aggregates (no opaque ML).
 */
export function analyzeCoachingSignals(profile: SalesProfile): CoachingAnalysis {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const trainingPriorityAreas: string[] = [];

  const pers = profile.personalityAvgScore;
  const sess = profile.personalitySessionCount;

  let bestP: ScenarioPersonality | undefined;
  let worstP: ScenarioPersonality | undefined;
  let bestSc = -1;
  let worstSc = 101;
  for (const k of Object.keys(pers) as ScenarioPersonality[]) {
    const n = sess[k] ?? 0;
    if (n < 2) continue;
    const sc = pers[k] ?? 0;
    if (sc > bestSc) {
      bestSc = sc;
      bestP = k;
    }
    if (sc < worstSc) {
      worstSc = sc;
      worstP = k;
    }
  }

  if (bestP && bestSc >= 72) {
    strengths.push(`Strong practice scores with ${bestP.toLowerCase()} personas (avg ~${Math.round(bestSc)}).`);
  }
  if (profile.averageTrainingScore >= 75 && profile.trainingSessionCount >= 3) {
    strengths.push(`Consistent training performance (avg lab ~${Math.round(profile.averageTrainingScore)}).`);
  }
  if ((profile.averageControlScore ?? 0) >= 72 && profile.totalCalls >= 3) {
    strengths.push(`Solid control scores on logged calls (~${Math.round(profile.averageControlScore)}).`);
  }
  if (profile.improvementTrend === "up") {
    strengths.push("Recent trajectory is improving vs prior rolling window.");
  }

  if (worstP && worstSc < 68 && (sess[worstP] ?? 0) >= 2) {
    weaknesses.push(`Pull-down on ${worstP.toLowerCase()} scenarios (avg ~${Math.round(worstSc)}).`);
    trainingPriorityAreas.push(`${worstP.toLowerCase()} buyer simulation`);
  }

  const demoRate = profile.totalCalls > 0 ? profile.demosBooked / profile.totalCalls : 0;
  if (profile.totalCalls >= 5 && demoRate < 0.12) {
    weaknesses.push(`Demo/book rate low (${Math.round(demoRate * 100)}% over ${profile.totalCalls} logged calls).`);
    trainingPriorityAreas.push("calendar asks & skeptical objections");
  }

  const closeDenom = profile.closesWon + profile.closesLost;
  if (closeDenom >= 5) {
    const wr = profile.closesWon / closeDenom;
    if (wr < 0.25) {
      weaknesses.push(`Win rate on tracked closes (${Math.round(wr * 100)}%) suggests qualification or close mechanics.`);
      trainingPriorityAreas.push("binary closes & qualification gates");
    }
  }

  if ((profile.averageClosingScore ?? 70) < 62 && profile.trainingSessionCount >= 2) {
    weaknesses.push(`Closing mechanics in lab below target (~${Math.round(profile.averageClosingScore)}).`);
    trainingPriorityAreas.push("closing frameworks");
  }

  if ((profile.averageControlScore ?? 70) < 60 && profile.totalCalls >= 3) {
    weaknesses.push(`Control scores imply frame loss on calls (~${Math.round(profile.averageControlScore)}).`);
    trainingPriorityAreas.push("control questions & objection loops");
  }

  for (const w of profile.weakMomentSignals) {
    if (LONG_MONOLOGUE_HINTS.test(w)) {
      weaknesses.push("Replay reviews flagged long explanations.");
      trainingPriorityAreas.push("concise proof + question pacing");
      break;
    }
  }
  for (const w of profile.weakMomentSignals) {
    if (WEAK_CLOSE_HINTS.test(w)) {
      weaknesses.push("Replay reviews flagged hedged / weak closes.");
      trainingPriorityAreas.push("time-bound calendar asks");
      break;
    }
  }

  const objTop = profile.mostCommonObjections[0];
  if (objTop && (profile.objectionCounts[objTop] ?? 0) >= 3) {
    weaknesses.push(`Repeated objection theme: "${objTop.slice(0, 48)}…"`);
    trainingPriorityAreas.push(`objection drills: ${objTop.slice(0, 40)}`);
  }

  if (profile.weakestPersonalityMatch === "ANALYTICAL") {
    weaknesses.push("Analytics-heavy buyers remain a friction point in practice.");
    trainingPriorityAreas.push("analytical proof paths");
  }
  if (profile.weakestScenarioType === "INVESTOR" && (profile.audienceSessionCount.INVESTOR ?? 0) >= 2) {
    weaknesses.push("Investor scenarios trending weaker than broker runs.");
    trainingPriorityAreas.push("investor diligence dialogue");
  }

  // Ensure top 3 cap
  const uniq = (xs: string[]) => [...new Set(xs)];

  return {
    strengths: uniq(strengths).slice(0, 8),
    weaknesses: uniq(weaknesses).slice(0, 8),
    trainingPriorityAreas: uniq(trainingPriorityAreas).slice(0, 6),
  };
}
