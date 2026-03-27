/**
 * AI Property Manager – monitor health, detect low performance, suggest actions.
 */

import { calculateScore } from "@/lib/ai/brain";
import type { ListingAnalysisInput } from "@/lib/ai-listing-analysis";

export type ManagerResult = {
  status: "healthy" | "needs_attention" | "low_performance";
  issues: string[];
  recommendedActions: string[];
};

function str(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  return String(v);
}

export function monitorListingHealth(listing: ListingAnalysisInput): ManagerResult["status"] {
  const score = calculateScore(listing);
  if (score >= 70) return "healthy";
  if (score >= 50) return "needs_attention";
  return "low_performance";
}

export function detectLowPerformance(listing: ListingAnalysisInput): string[] {
  const issues: string[] = [];
  const title = str(listing?.title);
  const desc = str(listing?.description);
  const score = calculateScore(listing);

  if (score < 50) issues.push("Overall listing quality is below average");
  if (title.length < 30) issues.push("Title is too short to stand out");
  if (desc.length < 150) issues.push("Description may not hold viewer attention");
  if (!Array.isArray(listing?.photos) || listing.photos.length === 0) {
    issues.push("No photos — listings with images perform better");
  }
  if (!Array.isArray(listing?.amenities) || listing.amenities.length === 0) {
    issues.push("Add a few amenities to make the listing easier to compare");
  }
  if (!/schedule|viewing|contact|call/i.test(desc)) issues.push("No clear call to action");
  return issues;
}

export function suggestManagerActions(listing: ListingAnalysisInput): string[] {
  const actions: string[] = [];
  const title = str(listing?.title);
  const desc = str(listing?.description);
  const hasImage = Array.isArray(listing?.photos) && listing.photos.length > 0;

  if (title.length < 50) actions.push("Improve title with key features and power words");
  if (desc.length < 200) actions.push("Strengthen description with location and benefits");
  if (!hasImage) actions.push("Add high-quality photos");
  if (!listing?.location?.city) actions.push("Clarify the neighborhood or city");
  if (!/urgency|don't miss|schedule|viewing|contact|today/i.test(desc)) {
    actions.push("Add urgency wording and a clear call to action");
  }
  const score = calculateScore(listing);
  if (score < 60) actions.push("Review AI suggestions and apply optimizations");
  return actions.slice(0, 6);
}

export function getManagerInsights(listing: ListingAnalysisInput): ManagerResult {
  const status = monitorListingHealth(listing);
  const issues = detectLowPerformance(listing);
  const recommendedActions = suggestManagerActions(listing);
  return { status, issues, recommendedActions };
}
