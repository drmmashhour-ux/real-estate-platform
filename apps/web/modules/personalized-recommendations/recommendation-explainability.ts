import type { LoadedRecommendationContext } from "./recommendation-context.loader";

const SAFE = {
  budget: "Matches your budget",
  similar: "Similar to properties you viewed",
  area: "Strong value in your preferred area",
  esg: "Fits your ESG preference",
  investor: "Good match for your investment profile",
  conversion: "Popular with guests like you",
  brokerPriority: "Worth prioritizing now",
  cold: "Popular listings in your market",
  generic: "Suggested for you",
} as const;

export function buildUserSafeExplanation(args: {
  factors: Record<string, number>;
  mode: string;
  coldStart: boolean;
}): string {
  const entries = Object.entries(args.factors).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  const top = entries[0]?.[0];

  if (args.coldStart) {
    if (top === "cityAffinity") return SAFE.area;
    return SAFE.cold;
  }

  switch (top) {
    case "budgetFit":
      return SAFE.budget;
    case "similarity":
    case "propertyTypeAffinity":
      return SAFE.similar;
    case "cityAffinity":
      return SAFE.area;
    case "esgAffinity":
      return SAFE.esg;
    case "investorFit":
    case "underwritingFit":
      return SAFE.investor;
    case "bookingFit":
    case "guestAffinity":
      return SAFE.conversion;
    case "leadScore":
    case "dealMomentum":
      return SAFE.brokerPriority;
    default:
      return SAFE.generic;
  }
}

export function profileSummaryForDebug(ctx: LoadedRecommendationContext): Record<string, unknown> {
  const topCities = Object.entries(ctx.cityWeights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([city, w]) => ({ city, weight: w }));
  const topTypes = Object.entries(ctx.propertyTypeWeights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t, w]) => ({ type: t, weight: w }));

  return {
    personalizationEnabled: ctx.personalizationEnabled,
    homeCity: ctx.homeCity,
    topCities,
    topPropertyTypes: topTypes,
    medianViewedPriceCad: ctx.medianViewedPriceCad,
    greenSignalViews: ctx.greenViewCount,
    valueAddHint: ctx.valueAddHint,
    recentViews: ctx.viewedFsboIds.length,
    recentSaves: ctx.savedFsboIds.length,
  };
}
