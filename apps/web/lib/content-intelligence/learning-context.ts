import type { ListingContentInput } from "@/lib/content-automation/types";
import { analyzeOptimizationSignals } from "./get-winners";
import { generateContentRecommendations, styleBiasWeights } from "./generate-recommendations";

export type LearningAugmentation = {
  systemExtra: string;
  userExtra: string;
};

/**
 * Builds prompt addenda for OpenAI generation: favors empirical winners while preserving exploration.
 */
export async function buildLearningAugmentationForListing(
  input: ListingContentInput
): Promise<LearningAugmentation | null> {
  const sig = await analyzeOptimizationSignals(0.12);
  if (!sig) return null;

  const recs = generateContentRecommendations(sig, {
    nightPriceCents: input.nightPriceCents,
    city: input.city,
  });
  const weights = styleBiasWeights(sig, 0.22);
  const weightLines = Object.entries(weights)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `- ${k}: ${(v * 100).toFixed(1)}% suggested emphasis (soft; still produce all five packs)`)
    .join("\n");

  const hookHint = sig.hookExamples.slice(0, 5).map((h) => `• ${h.slice(0, 120)}`).join("\n");

  const systemExtra = [
    "LEARNING SIGNALS (do not invent facts; use only to tune tone and structure):",
    "Prefer hooks and pacing similar to these high-performing examples (paraphrase; do not copy verbatim):",
    hookHint || "(no hook examples yet)",
    "",
    "Style emphasis weights (informational — you must still output all five styles with valid flags):",
    weightLines,
    "",
    "Exploration: include at least one pack that deliberately tries a fresh angle even if it is not the top style.",
  ].join("\n");

  const cityKey = input.city.trim().toLowerCase().replace(/\s+/g, "_");
  const cityRow = sig.cityStyleHints.find((c) => c.cityKey === cityKey);
  const userExtra = [
    "Operator notes from performance analytics:",
    ...recs.map((r) => `- ${r.replace(/\*\*/g, "")}`),
    cityRow
      ? `City-specific cohort leader for ${input.city}: ${cityRow.topStyle}.`
      : "",
    input.nightPriceCents > 0 && input.nightPriceCents < 12000
      ? "This listing is in a lower nightly price band — price-led curiosity hooks are appropriate if price is valid."
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return { systemExtra, userExtra };
}
