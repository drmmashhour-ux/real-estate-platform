/**
 * Hub-scoring and marketing fallbacks — deterministic, client-safe (no Prisma / pool).
 * Connect live models via API routes without pulling server-only modules into the client graph.
 */
import type { ListingAnalysisInput } from "@/lib/ai-listing-analysis";
import { analyzeListing as analyzeListingCore } from "@/lib/ai-listing-analysis";
import type { HubKey } from "@/lib/hub/router";

export type { HubKey };

export function calculateScore(input: ListingAnalysisInput): number {
  return analyzeListingCore(input).overallScore;
}

export function analyzeListing(
  input: ListingAnalysisInput & {
    price?: number;
    bedrooms?: number;
    bathrooms?: number;
    city?: string;
  }
): { score: number } {
  return { score: calculateScore(input) };
}

export function getAdminAiSummary() {
  return {
    alertsCount: 0,
    fraudFlags: 0,
    revenueOpportunitySummary: "Signals are quiet — wire analytics for a live rollup.",
  };
}

export function getAiFallbacksForHub(hub: string): Record<string, unknown> {
  const marketing = {
    headline: "Stronger listings start with real details",
    body: "Ground copy in photos, amenities, and verified facts — no invented comps.",
    cta: "Open listing tools",
  };
  const listingScore = {
    score: 72,
    summary: "Heuristic score from title, description, amenities, and photo count.",
  };
  if (hub === "luxury") {
    return {
      listingScore,
      marketing,
      template: { id: "luxury-hero", name: "Luxury hero" },
      insights: "Premium positioning works best with proof points you can verify.",
    };
  }
  if (hub === "realEstate") {
    return { listingScore, marketing };
  }
  return { listingScore, marketing, template: { id: "default", name: "Standard" } };
}

export function suggestBrokerNextAction(_input: {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
}): { action: string } {
  return { action: "Confirm interest, then propose a short call with 2 time options." };
}

export function suggestBnHubPricing(_listingHint: string): {
  recommendedCents: number;
  minCents: number;
  maxCents: number;
  demandLevel: "low" | "medium" | "high";
  factors: string[];
} {
  void _listingHint;
  return {
    recommendedCents: 15_000,
    minCents: 12_000,
    maxCents: 18_000,
    demandLevel: "medium",
    factors: ["Baseline band — connect BNHUB analytics for comps-driven pricing."],
  };
}

export function recommendLuxuryTemplate(): { name: string; reason: string } {
  return { name: "Luxury showcase", reason: "Neutral default when templates are not loaded from projects." };
}

export function getLuxuryInsights(): { luxuryAppealScore: number; suggestions: string[] } {
  return {
    luxuryAppealScore: 85,
    suggestions: ["Use premium imagery with rights cleared.", "Highlight services you can deliver consistently."],
  };
}

export function generateMarketing(input: { listingId?: string; title?: string }) {
  const title = input.title?.trim() || "Featured property";
  return {
    headline: `${title}`,
    body: `Marketing snippet for ${title}. Replace with approved brand copy before campaigns.`,
    cta: "Book a tour",
  };
}
