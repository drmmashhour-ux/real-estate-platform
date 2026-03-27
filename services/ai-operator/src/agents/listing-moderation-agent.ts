import type { ListingModerationInput, ListingModerationOutput } from "../models/agents.js";

export function runListingModerationAgent(input: ListingModerationInput): ListingModerationOutput {
  const missingInfoAlerts: string[] = [];
  const trustFlags: string[] = [];
  let score = 80;

  if (!input.title || input.title.length < 10) {
    missingInfoAlerts.push("Title too short or missing");
    trustFlags.push("weak_title");
    score -= 15;
  }
  const descLen = (input.description ?? "").length;
  if (descLen < 100) {
    missingInfoAlerts.push("Description too short");
    score -= 15;
  } else if (descLen < 250) {
    missingInfoAlerts.push("Consider longer description for clarity");
    score -= 5;
  }
  if ((input.amenities ?? []).length < 2) {
    missingInfoAlerts.push("Add more amenities");
    score -= 8;
  }
  if ((input.photoCount ?? 0) < 3) {
    missingInfoAlerts.push("Add more photos");
    trustFlags.push("low_photo_count");
    score -= 12;
  }
  if (!input.houseRules || input.houseRules.length < 10) {
    missingInfoAlerts.push("House rules missing or too brief");
    score -= 5;
  }
  if (input.nightPriceCents != null && input.nightPriceCents <= 0) {
    trustFlags.push("invalid_pricing");
    score -= 20;
  }

  score = Math.max(0, Math.min(100, score));
  const confidence = score >= 70 ? 0.85 : score >= 50 ? 0.65 : 0.5;
  const moderationStatus: ListingModerationOutput["moderationStatus"] =
    score >= 80 && trustFlags.length === 0
      ? "approve"
      : score < 50 || trustFlags.includes("invalid_pricing")
        ? "manual_review"
        : "manual_review";
  const reasonCodes = [...missingInfoAlerts.map((a) => `missing:${a.replace(/\s/g, "_")}`), ...trustFlags];

  return {
    listingQualityScore: score,
    moderationStatus,
    missingInfoAlerts,
    trustFlags,
    confidenceScore: confidence,
    recommendedAction: moderationStatus === "approve" ? "approve_listing" : "flag_for_review",
    reasonCodes,
    escalateToHuman: moderationStatus === "manual_review" || score < 60,
  };
}
