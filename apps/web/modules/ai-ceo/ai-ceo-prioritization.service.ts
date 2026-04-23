import type {
  AiCeoImpactBand,
  AiCeoPrioritizationBucket,
  AiCeoPrioritizedSet,
  AiCeoRecommendationDraft,
  AiCeoUrgency,
} from "@/modules/ai-ceo/ai-ceo.types";

function impactWeight(b: AiCeoImpactBand): number {
  switch (b) {
    case "meaningful":
      return 1;
    case "moderate":
      return 0.65;
    case "low":
      return 0.35;
    default:
      return 0.45;
  }
}

function urgencyWeight(u: AiCeoUrgency): number {
  switch (u) {
    case "critical":
      return 1;
    case "high":
      return 0.85;
    case "medium":
      return 0.55;
    default:
      return 0.3;
  }
}

function effortPenalty(e: AiCeoRecommendationDraft["requiredEffort"]): number {
  switch (e) {
    case "low":
      return 1;
    case "medium":
      return 0.85;
    default:
      return 0.65;
  }
}

/** Composite score — **not** financial ROI; used only for ordering suggestions. */
export function prioritizationScore(d: AiCeoRecommendationDraft): number {
  return (
    d.confidenceScore *
    impactWeight(d.expectedImpactBand) *
    urgencyWeight(d.urgency) *
    effortPenalty(d.requiredEffort)
  );
}

export function assignPrioritizationBucket(
  d: AiCeoRecommendationDraft,
  score: number
): AiCeoPrioritizationBucket {
  if (d.executionSafety === "NEVER_AUTO" && d.expectedImpactBand === "meaningful" && d.confidenceScore >= 0.55) {
    return "HIGH_RISK_HIGH_REWARD";
  }
  if (score < 0.22 && d.expectedImpactBand === "low") return "LOW_VALUE";
  if (d.requiredEffort === "low" && score >= 0.35 && d.urgency !== "low") return "QUICK_WIN";
  if (score >= 0.42 || d.urgency === "critical") return "TOP_PRIORITY";
  if (score < 0.25) return "LOW_VALUE";
  return "TOP_PRIORITY";
}

export function prioritizeRecommendations(drafts: AiCeoRecommendationDraft[]): AiCeoPrioritizedSet {
  const scored = drafts.map((d) => ({ d, score: prioritizationScore(d) }));
  const topPriorities: AiCeoRecommendationDraft[] = [];
  const quickWins: AiCeoRecommendationDraft[] = [];
  const highRiskHighReward: AiCeoRecommendationDraft[] = [];
  const lowValue: AiCeoRecommendationDraft[] = [];

  for (const { d, score } of scored) {
    const bucket = assignPrioritizationBucket(d, score);
    const tagged = { ...d, prioritizationBucket: bucket };
    switch (bucket) {
      case "QUICK_WIN":
        quickWins.push(tagged);
        break;
      case "HIGH_RISK_HIGH_REWARD":
        highRiskHighReward.push(tagged);
        break;
      case "LOW_VALUE":
        lowValue.push(tagged);
        break;
      default:
        topPriorities.push(tagged);
    }
  }

  const sortFn = (a: AiCeoRecommendationDraft, b: AiCeoRecommendationDraft) =>
    prioritizationScore(b) - prioritizationScore(a);

  topPriorities.sort(sortFn);
  quickWins.sort(sortFn);
  highRiskHighReward.sort(sortFn);
  lowValue.sort(sortFn);

  return { topPriorities, quickWins, highRiskHighReward, lowValue };
}
