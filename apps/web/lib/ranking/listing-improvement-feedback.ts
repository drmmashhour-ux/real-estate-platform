/**
 * Actionable suggestions for hosts / brokers — ties to ranking signal gaps (no ML).
 */

import type { BnhubListingRankingInput, FsboListingRankingInput, RankingSignalBundle } from "@/src/modules/ranking/types";

export function bnhubListingImprovementHints(
  input: BnhubListingRankingInput,
  signals: RankingSignalBundle
): string[] {
  const hints: string[] = [];
  if (input.photoCount < 6) hints.push("Add more photos (aim for 8+ high-quality images).");
  if ((input.description ?? "").trim().length < 200) hints.push("Expand the description with amenities, neighborhood, and house rules.");
  const am = Array.isArray(input.amenities) ? input.amenities.length : 0;
  if (am < 6) hints.push("Complete amenities so guests can filter and trust the listing.");
  if (!input.houseRules?.trim()) hints.push("Add house rules for clarity and trust.");
  if (!input.checkInInstructions?.trim()) hints.push("Add check-in instructions (reduces friction and disputes).");
  if (signals.review < 0.5 && input.reviewCount < 3) hints.push("Encourage completed guests to leave a review.");
  if (signals.priceCompetitiveness < 0.45) hints.push("Review nightly price vs similar stays in your area.");
  if (signals.host < 0.55) hints.push("Improve response time — reply to inquiries within a few hours when possible.");
  return hints;
}

export function fsboListingImprovementHints(input: FsboListingRankingInput, signals: RankingSignalBundle): string[] {
  const hints: string[] = [];
  if (input.images.length < 5) hints.push("Add more photos (exterior, kitchen, bedrooms).");
  if (input.description.trim().length < 200) hints.push("Improve the title and description with key facts buyers care about.");
  if (signals.priceCompetitiveness < 0.45) hints.push("Adjust price to be closer to comparable listings in your area.");
  if (signals.engagement < 0.4 && input.viewCount > 50) hints.push("Low engagement vs views — refresh photos and headline.");
  if (signals.conversion < 0.35) hints.push("Improve lead conversion: respond faster and complete listing fields.");
  if (signals.trust < 0.5) hints.push("Complete verification and keep moderation status healthy.");
  return hints;
}
