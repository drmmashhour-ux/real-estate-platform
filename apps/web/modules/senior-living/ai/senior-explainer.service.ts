/**
 * Plain-language explanations only — no technical scoring for families.
 */
import type { MatchingEngineRow, SeniorAiProfileInput, UiExplanationPack } from "./senior-ai.types";
import type { ResidenceMatchInput } from "./senior-matching.engine";

export function explainMatchForFamily(
  profile: SeniorAiProfileInput,
  row: MatchingEngineRow,
  r: Pick<ResidenceMatchInput, "city" | "verified">,
): UiExplanationPack {
  const bullets: string[] = [];
  if (row.fitLabel === "STRONG" || row.componentScores.careMatch >= 85) {
    bullets.push("Matches the level of help you described");
  } else if (row.warnings.length) {
    bullets.push("We suggest confirming care fit on a visit");
  } else {
    bullets.push("Could be a fit — your visit will confirm details");
  }

  if (row.componentScores.budgetMatch >= 85 && profile.budgetMonthly != null) {
    bullets.push("Fits your budget range");
  } else if (profile.budgetMonthly != null) {
    bullets.push("Pricing may need a quick question on your budget");
  }

  if (
    profile.preferredCity?.trim() &&
    r.city.toLowerCase() === profile.preferredCity.trim().toLowerCase()
  ) {
    bullets.push(`Located in ${r.city}`);
  }

  if (row.componentScores.servicesMatch >= 78) {
    bullets.push("Offers services that line up with daily living needs");
  }

  if (r.verified) bullets.push("Verified on this platform");

  const headline =
    row.fitLabel === "STRONG" ? "Best match for your needs"
    : row.fitLabel === "GOOD" ? "Good option to consider"
    : row.fitLabel === "POSSIBLE" ? "Worth a closer look"
    : "Compare carefully with your family";

  return {
    headline,
    bullets: [...new Set(bullets)].slice(0, 4),
  };
}

export function explainWhyTheseOptions(): string {
  return "We use what you shared — care needs, budget, and area — to suggest a short list. Your visit always decides.";
}
