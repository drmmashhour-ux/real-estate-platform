/**
 * Maximum-AI matching — weighted explainable components + severe care guardrails.
 */
import type { FitLabel, MatchingEngineRow, SeniorAiProfileInput } from "./senior-ai.types";

const CARE_ORDER = ["AUTONOMOUS", "SEMI_AUTONOMOUS", "ASSISTED", "FULL_CARE"] as const;

function careRank(level: string): number {
  const i = CARE_ORDER.indexOf(level as (typeof CARE_ORDER)[number]);
  return i >= 0 ? i : 0;
}

function desiredCareRank(profile: SeniorAiProfileInput): number {
  let r = 0;
  const care = profile.careNeedLevel?.toUpperCase() ?? "";
  if (care.includes("HIGH") || care === "HIGH") r = Math.max(r, careRank("FULL_CARE"));
  else if (care.includes("MEDIUM") || care === "MEDIUM") r = Math.max(r, careRank("ASSISTED"));
  else if (care.includes("LOW") || care === "LOW") r = Math.max(r, careRank("SEMI_AUTONOMOUS"));

  const mob = profile.mobilityLevel?.toUpperCase() ?? "";
  if (mob.includes("DEPENDENT")) r = Math.max(r, careRank("FULL_CARE"));
  else if (mob.includes("LIMITED")) r = Math.max(r, careRank("ASSISTED"));

  if (profile.medicalSupportNeeded) r = Math.max(r, careRank("ASSISTED"));
  if (profile.memorySupportNeeded) r = Math.max(r, careRank("ASSISTED"));
  return r;
}

export type ResidenceMatchInput = {
  id: string;
  careLevel: string;
  city: string;
  basePrice: number | null;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  verified: boolean;
  has24hStaff: boolean;
  mealsIncluded: boolean;
  medicalSupport: boolean;
  activitiesIncluded: boolean;
  unitsAvailable?: number | null;
};

/**
 * Component scores are 0–100 before weights.
 */
export function scoreResidenceMatch(
  profile: SeniorAiProfileInput,
  r: ResidenceMatchInput,
): MatchingEngineRow {
  const warnings: string[] = [];
  const desired = desiredCareRank(profile);
  const resRank = careRank(r.careLevel);
  const severeMismatch = resRank < desired;

  let careMatch = severeMismatch ? 28 : resRank === desired ? 96 : 78;
  if (severeMismatch) warnings.push("Care level may be lower than what you described — always confirm in person.");

  let budgetMatch = 70;
  const budget = profile.budgetMonthly;
  if (budget != null) {
    const min = r.priceRangeMin ?? r.basePrice;
    const max = r.priceRangeMax ?? r.basePrice;
    if (min != null && max != null && budget >= min && budget <= max) budgetMatch = 95;
    else if (r.basePrice != null && budget >= r.basePrice * 0.88) budgetMatch = 76;
    else if (min != null && budget < min * 0.92) budgetMatch = 38;
    else budgetMatch = 62;
  }

  const cityOk =
    profile.preferredCity?.trim() &&
    r.city.toLowerCase() === profile.preferredCity.trim().toLowerCase();
  const locationMatch = cityOk ? 100 : 52;

  let servicesMatch = 55;
  let hits = 0;
  if (r.mealsIncluded && profile.mealSupportNeeded) hits += 1;
  if (r.medicalSupport && profile.medicalSupportNeeded) hits += 1;
  if (r.activitiesIncluded && profile.socialActivityPriority) hits += 1;
  if (r.has24hStaff && profile.urgencyLevel?.toUpperCase() === "HIGH") hits += 1;
  servicesMatch = Math.min(100, 48 + hits * 14);
  if (r.verified) servicesMatch = Math.min(100, servicesMatch + 10);

  const availabilitySignal =
    r.unitsAvailable != null && r.unitsAvailable > 0 ? 88 : r.unitsAvailable === 0 ? 40 : 66;

  const lang = profile.languagePreference?.toUpperCase() ?? "";
  const languageComfort = lang === "FR" || lang === "EN" ? 82 : 70;

  const urg = profile.urgencyLevel?.toUpperCase() ?? "LOW";
  const urgencyFit =
    urg === "HIGH" ? (r.has24hStaff ? 92 : 72) : urg === "MEDIUM" ? 78 : 74;

  const W = {
    care: 0.3,
    budget: 0.18,
    location: 0.14,
    services: 0.14,
    availability: 0.08,
    language: 0.08,
    urgency: 0.08,
  };

  const baseScore = Math.round(
    W.care * careMatch +
      W.budget * budgetMatch +
      W.location * locationMatch +
      W.services * servicesMatch +
      W.availability * availabilitySignal +
      W.language * languageComfort +
      W.urgency * urgencyFit,
  );

  let fitLabel: FitLabel = "GOOD";
  if (severeMismatch || baseScore < 42) fitLabel = "WEAK";
  else if (baseScore >= 82 && !severeMismatch) fitLabel = "STRONG";
  else if (baseScore >= 68) fitLabel = "GOOD";
  else fitLabel = "POSSIBLE";

  /** Never promote to top-tier if severe care mismatch */
  if (severeMismatch && fitLabel === "STRONG") fitLabel = "POSSIBLE";

  return {
    residenceId: r.id,
    baseScore: Math.max(0, Math.min(100, baseScore)),
    componentScores: {
      careMatch,
      budgetMatch,
      locationMatch,
      servicesMatch,
      availabilitySignal,
      languageComfort,
      urgencyFit,
    },
    fitLabel,
    warnings,
  };
}
