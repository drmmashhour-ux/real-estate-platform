import { greenAiLog } from "../green-ai-logger";
import {
  agePotentialScore,
  heatingPotentialScore,
  insulationPotentialScore,
  isResidentialPropertyType,
  levelFromPotentialScore,
  locationAppearsQuebec,
  sumPotentialScore,
  windowsPotentialScore,
} from "./renoclimat.eligibility";
import {
  RENOCLIMAT_OFFICIAL_DISCLAIMER,
  type RenoclimatEligibilityResult,
  type RenoclimatInput,
} from "./renoclimat.types";

const IMPROVEMENT_THRESHOLD = 24;

function buildReasons(input: RenoclimatInput, potentialScore: number, tags: Set<string>): string[] {
  const reasons: string[] = [];
  if (!locationAppearsQuebec(input.locationRegion)) {
    reasons.push("Indicated location does not appear to be in Québec — Rénoclimat applies to eligible Québec residential projects.");
    return reasons;
  }
  if (!isResidentialPropertyType(input.propertyType)) {
    reasons.push("Non-residential archetypes are usually outside standard homeowner Rénoclimat tracks.");
    return reasons;
  }
  if (tags.has("oil_fossil")) reasons.push("Oil heating is typically a strong candidate for electrification / audit-led bundles.");
  if (tags.has("insulation_poor") || tags.has("insulation_average")) reasons.push("Envelope upgrades often unlock measure-based incentives after evaluation.");
  if (tags.has("windows_single")) reasons.push("Single glazing has high savings potential in cold climates.");
  if (tags.has("legacy_building") || tags.has("older_building")) reasons.push("Older shells frequently qualify for staged retrofit pathways.");
  if (tags.has("heat_pump")) reasons.push("Heat pump already present may shift incentive focus to envelope or remaining systems.");
  if (potentialScore < IMPROVEMENT_THRESHOLD && tags.has("insulation_good") && tags.has("windows_high_perf")) {
    reasons.push("Major systems already performance-oriented — remaining incentive scope may be narrow.");
  }
  if (reasons.length === 0) reasons.push("Combine an approved evaluation with prioritized measures to align with program rules.");
  return reasons.slice(0, 8);
}

function buildActions(level: RenoclimatEligibilityResult["eligibilityLevel"], tags: Set<string>): string[] {
  const base = [
    "Book a certified Énerguide / Rénoclimat evaluation before structural work.",
    "Collect quotes from RBQ-licensed contractors aligned with approved measures.",
  ];
  if (tags.has("oil_fossil") || tags.has("fossil_gas")) {
    base.unshift("Plan heating transition (e.g. cold-climate heat pump sizing) with your evaluator’s report.");
  }
  if (tags.has("insulation_poor") || tags.has("windows_single")) {
    base.unshift("Prioritize attic insulation and window upgrades where the evaluation identifies highest savings.");
  }
  if (level === "LOW") {
    base.push("If scores look strong already, confirm marginal measures with an evaluator — rules change by intake.");
  }
  return base.slice(0, 6);
}

/**
 * Estimates whether a Québec residential asset may have Rénoclimat-relevant retrofit headroom — **not** official eligibility.
 */
export function runRenoclimatEligibility(input: RenoclimatInput): RenoclimatEligibilityResult {
  const tagSet = new Set<string>();

  const h = heatingPotentialScore(input.heatingType);
  h.tags.forEach((t) => tagSet.add(t));

  const ins = insulationPotentialScore(input.insulationQuality ?? undefined);
  ins.tags.forEach((t) => tagSet.add(t));

  const win = windowsPotentialScore(input.windowsQuality ?? undefined);
  win.tags.forEach((t) => tagSet.add(t));

  const age = agePotentialScore(input.yearBuilt ?? undefined);
  age.tags.forEach((t) => tagSet.add(t));

  const potentialScore = sumPotentialScore([h.score, ins.score, win.score, age.score]);

  const inQuebec = locationAppearsQuebec(input.locationRegion);
  const residential = isResidentialPropertyType(input.propertyType);
  const eligibilityLevel = levelFromPotentialScore(potentialScore);

  const eligible =
    inQuebec && residential && potentialScore >= IMPROVEMENT_THRESHOLD;

  const reasons = buildReasons(input, potentialScore, tagSet);
  const recommendedActions = buildActions(eligibilityLevel, tagSet);

  if (!inQuebec) {
    reasons.unshift("Location filter: Rénoclimat-style programs are Québec-scoped.");
  } else if (!residential) {
    reasons.unshift("Property type appears non-residential for standard homeowner pathways.");
  } else if (!eligible && potentialScore < IMPROVEMENT_THRESHOLD) {
    reasons.unshift(
      "Modeled improvement headroom is limited — official evaluation may still clarify marginal measures.",
    );
  }

  const headline =
    eligibilityLevel === "HIGH"
      ? "Strong retrofit incentive potential (modeled)"
      : eligibilityLevel === "MEDIUM"
        ? "Moderate retrofit incentive potential (modeled)"
        : "Limited modeled headroom — confirm with an evaluator";

  greenAiLog.info("renoclimat_eligibility", {
    eligible,
    eligibilityLevel,
    potentialScore,
    inQuebec,
    residential,
  });

  return {
    eligible,
    eligibilityLevel,
    reasons,
    recommendedActions,
    disclaimer: RENOCLIMAT_OFFICIAL_DISCLAIMER,
    headline,
  };
}
