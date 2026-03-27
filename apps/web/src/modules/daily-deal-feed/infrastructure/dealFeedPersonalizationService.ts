import type {
  DailyDealCandidate,
  FeedInteractionSignal,
  FeedPreferences,
  InteractionType,
  StrategyMode,
} from "@/src/modules/daily-deal-feed/domain/dailyDealFeed.types";

type FitResult = {
  score: number;
  reasons: string[];
};

function strategyBoost(strategy: StrategyMode | null, c: DailyDealCandidate): number {
  if (!strategy) return 0;
  if (strategy === "cashflow") return c.confidence >= 60 ? 6 : 1;
  if (strategy === "appreciation") return c.dealScore >= 70 ? 6 : 1;
  if (strategy === "flip") return c.dealScore >= 75 && c.riskScore < 55 ? 7 : 0;
  return 2;
}

function interactionWeight(kind: InteractionType): number {
  if (kind === "saved") return 1;
  if (kind === "analyzed") return 0.8;
  if (kind === "clicked") return 0.4;
  if (kind === "ignored" || kind === "dismissed") return -0.9;
  if (kind === "contacted") return 0.6;
  return 0.2;
}

export function computePersonalizationFit(args: {
  candidate: DailyDealCandidate;
  preferences: FeedPreferences | null;
  interactions: FeedInteractionSignal[];
  onboardingRole?: string | null;
}): FitResult {
  const { candidate, preferences, interactions, onboardingRole } = args;
  let score = 50;
  const reasons: string[] = [];

  const prefCities = preferences?.preferredCities ?? [];
  if (prefCities.length > 0) {
    if (prefCities.map((x) => x.toLowerCase()).includes(candidate.city.toLowerCase())) {
      score += 18;
      reasons.push("City match");
    } else {
      score -= 10;
    }
  }

  const prefTypes = preferences?.preferredPropertyTypes ?? [];
  if (prefTypes.length > 0 && candidate.propertyType) {
    if (prefTypes.map((x) => x.toLowerCase()).includes(candidate.propertyType.toLowerCase())) {
      score += 12;
      reasons.push("Property-type match");
    } else {
      score -= 6;
    }
  }

  if (preferences?.budgetMin != null && candidate.priceCents < preferences.budgetMin) score -= 6;
  if (preferences?.budgetMax != null && candidate.priceCents > preferences.budgetMax) score -= 8;
  if (
    preferences?.budgetMin != null &&
    preferences?.budgetMax != null &&
    candidate.priceCents >= preferences.budgetMin &&
    candidate.priceCents <= preferences.budgetMax
  ) {
    score += 10;
    reasons.push("Budget fit");
  }

  score += strategyBoost(preferences?.strategyMode ?? null, candidate);

  if (!preferences && onboardingRole) {
    if (onboardingRole === "investor") score += candidate.dealScore >= 70 ? 7 : 0;
    if (onboardingRole === "broker") score += candidate.trustScore >= 60 ? 6 : 0;
  }

  const listingInteractions = interactions.filter((i) => i.listingId === candidate.listingId);
  if (listingInteractions.length > 0) {
    const signal = listingInteractions.reduce((acc, it) => acc + interactionWeight(it.interactionType), 0);
    score += signal * 8;
    if (signal < 0) reasons.push("Low engagement history");
    if (signal > 0) reasons.push("Prior positive engagement");
  }

  return { score: Math.max(0, Math.min(100, Math.round(score))), reasons };
}

export function computeEngagementFit(args: {
  candidate: DailyDealCandidate;
  interactions: FeedInteractionSignal[];
}): number {
  const recent = args.interactions.filter((i) => i.listingId === args.candidate.listingId);
  if (!recent.length) return 50;
  const raw = recent.reduce((acc, it) => acc + interactionWeight(it.interactionType), 0);
  return Math.max(0, Math.min(100, Math.round(50 + raw * 18)));
}
