import { TRAINING_SCENARIOS } from "@/modules/training-scenarios/training-scenarios.data";

import type {
  CoachingAnalysis,
  CoachingRecommendation,
  RecommendationUrgency,
  SalesProfile,
} from "./ai-sales-manager.types";
import { analyzeCoachingSignals } from "./ai-sales-coaching.service";
import { loadAiSalesStore, saveAiSalesStore, uid } from "./ai-sales-manager-storage";

function urgencyFor(weakCount: number, metric: number): RecommendationUrgency {
  if (weakCount >= 3 || metric < 0.12) return "high";
  if (weakCount >= 1 || metric < 0.22) return "medium";
  return "low";
}

function pickScenarios(predicate: (s: (typeof TRAINING_SCENARIOS)[number]) => boolean, limit: number): string[] {
  return TRAINING_SCENARIOS.filter(predicate)
    .slice(0, limit)
    .map((s) => s.id);
}

/**
 * Explainable coaching recs mapped to scenario catalog.
 */
export function generateCoachingRecommendations(
  profile: SalesProfile,
  analysis?: CoachingAnalysis,
): CoachingRecommendation[] {
  const a = analysis ?? analyzeCoachingSignals(profile);
  const out: CoachingRecommendation[] = [];
  const demoRate = profile.totalCalls > 0 ? profile.demosBooked / profile.totalCalls : 0;

  if (a.trainingPriorityAreas.some((x) => x.includes("analytical"))) {
    out.push({
      id: uid(),
      title: "Train skeptical / analytical buyer paths",
      reason:
        "Practice logs show weaker performance with analytical personas or proof-first buyers; matching lab builds muscle memory.",
      expectedImprovementArea: "Higher proof density and falsifiable claims under scrutiny",
      suggestedScenarioIds: pickScenarios(
        (s) => s.personality === "ANALYTICAL" || s.id.includes("skeptical"),
        3,
      ),
      urgency: urgencyFor(a.weaknesses.length, demoRate),
      triggers: [
        { label: "weakestPersonality", value: profile.weakestPersonalityMatch ?? "n/a" },
        { label: "priority", value: "analytical proof paths" },
      ],
      createdAtIso: new Date().toISOString(),
    });
  }

  if (a.trainingPriorityAreas.some((x) => x.includes("driver") || x.includes("calendar"))) {
    out.push({
      id: uid(),
      title: "Short closes for driver personas",
      reason:
        "Drivers punish rambling; scenarios emphasize headline value and binary calendar asks aligned with Training Hub personas.",
      expectedImprovementArea: "Time-boxed openings and decisive asks",
      suggestedScenarioIds: pickScenarios((s) => s.personality === "DRIVER", 3),
      urgency: urgencyFor(a.weaknesses.length, demoRate),
      triggers: [
        { label: "demoRate", value: demoRate.toFixed(2) },
        { label: "commonObjection", value: profile.mostCommonObjections[0] ?? "n/a" },
      ],
      createdAtIso: new Date().toISOString(),
    });
  }

  if (a.trainingPriorityAreas.some((x) => x.includes("objection"))) {
    const objectionIds = pickScenarios((s) => s.objections.some((o) => /already|everyone|vendor/i.test(o)), 3);
    out.push({
      id: uid(),
      title: "Objection ladder: already-have / vendor-fatigue",
      reason:
        "Repeated objection themes in logged calls — isolate top objection strings and rehearse pivot + micro-ask.",
      expectedImprovementArea: "Lower stall rate after first objection",
      suggestedScenarioIds:
        objectionIds.length > 0 ? objectionIds : pickScenarios((s) => s.difficulty === "HARD", 3),
      urgency: "high",
      triggers: profile.mostCommonObjections.slice(0, 2).map((o, i) => ({ label: `objection_${i}`, value: o })),
      createdAtIso: new Date().toISOString(),
    });
  }

  if (a.trainingPriorityAreas.some((x) => x.includes("investor"))) {
    out.push({
      id: uid(),
      title: "Investor diligence dialogue",
      reason: "Investor-side scenarios trend weaker than broker runs — balance narrative with falsifiable milestones.",
      expectedImprovementArea: "Meeting conversion on capital-side conversations",
      suggestedScenarioIds: pickScenarios((s) => s.type === "INVESTOR", 3),
      urgency: "medium",
      triggers: [{ label: "audienceAvg.INVESTOR", value: String(profile.audienceAvgScore.INVESTOR ?? "n/a") }],
      createdAtIso: new Date().toISOString(),
    });
  }

  if (out.length === 0) {
    out.push({
      id: uid(),
      title: "Maintain momentum — rotate difficulty",
      reason:
        "No acute gaps detected; rotate HARD/EXTREME scenarios to stress-test control and closing under pressure.",
      expectedImprovementArea: "Resilience and consistency at edge cases",
      suggestedScenarioIds: pickScenarios((s) => s.difficulty === "HARD" || s.difficulty === "EXTREME", 3),
      urgency: "low",
      triggers: [{ label: "trainingAvg", value: Math.round(profile.averageTrainingScore) }],
      createdAtIso: new Date().toISOString(),
    });
  }

  return out.slice(0, 8);
}

export function persistRecommendations(userId: string, recs: CoachingRecommendation[]): void {
  const store = loadAiSalesStore();
  store.recommendationsByUser[userId] = recs;
  saveAiSalesStore(store);
}

export function getStoredRecommendations(userId: string): CoachingRecommendation[] {
  return loadAiSalesStore().recommendationsByUser[userId] ?? [];
}
