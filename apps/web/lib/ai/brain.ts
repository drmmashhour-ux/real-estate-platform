/**
 * Shared AI Brain – unified interface for hubs. Use from API routes or client;
 * all functions return safe fallbacks when underlying services fail.
 */
import { analyzeListing as analyzeListingLib } from "@/lib/ai-listing-analysis";
import type { ListingAnalysisInput } from "@/lib/ai-listing-analysis";
import { scoreLead as scoreLeadLib } from "@/lib/ai/lead-scoring";
import type { LeadInput } from "@/lib/ai/lead-scoring";

export type ListingInput = ListingAnalysisInput;

// ─── Listing ───────────────────────────────────────────────────────────────

export type ListingAnalysisResult = {
  score: number;
  summary: string;
  recommendations: { type: string; priority: string; title: string; suggestion: string }[];
};

export function analyzeListing(input: ListingAnalysisInput): ListingAnalysisResult {
  try {
    const out = analyzeListingLib(input);
    return {
      score: out.overallScore,
      summary: out.summary,
      recommendations: out.recommendations,
    };
  } catch {
    return {
      score: 70,
      summary: "Analysis is temporarily unavailable. Check back soon.",
      recommendations: [],
    };
  }
}

export function calculateScore(input: ListingAnalysisInput): number {
  return analyzeListing(input).score;
}

export function optimizeListing(input: ListingAnalysisInput): ListingAnalysisResult {
  return analyzeListing(input);
}

// ─── Marketing ─────────────────────────────────────────────────────────────

export type MarketingSuggestion = {
  headline: string;
  body: string;
  cta: string;
};

export function generateMarketing(_context: { listingId?: string; title?: string }): MarketingSuggestion {
  return {
    headline: "Discover your next place",
    body: "Premium property with great location and amenities.",
    cta: "Request a viewing",
  };
}

// ─── Lead scoring ───────────────────────────────────────────────────────────

export type LeadScoreResult = {
  score: number;
  temperature: "hot" | "warm" | "cold";
  explanation: string;
};

export function scoreLead(lead: LeadInput): LeadScoreResult {
  try {
    return scoreLeadLib(lead);
  } catch {
    return {
      score: 50,
      temperature: "warm",
      explanation: "Lead saved; scoring will update when available.",
    };
  }
}

// ─── Investment ─────────────────────────────────────────────────────────────

export type InvestmentPrediction = {
  potentialScore: number;
  rentalYieldPct: number;
  riskScore: number;
  factors: string[];
};

export function predictInvestmentPotential(_listingId: string): InvestmentPrediction {
  return {
    potentialScore: 65,
    rentalYieldPct: 4.5,
    riskScore: 40,
    factors: ["Location", "Market demand", "Comparable sales"],
  };
}

// ─── BNHUB pricing ─────────────────────────────────────────────────────────

export type BnHubPricingSuggestion = {
  recommendedCents: number;
  minCents: number;
  maxCents: number;
  demandLevel: string;
  factors: string[];
};

export function suggestBnHubPricing(_listingId: string): BnHubPricingSuggestion {
  return {
    recommendedCents: 12000,
    minCents: 10200,
    maxCents: 13800,
    demandLevel: "medium",
    factors: ["Season", "Local demand", "Competitor rates"],
  };
}

// ─── Luxury ────────────────────────────────────────────────────────────────

export type LuxuryTemplateRecommendation = {
  templateId: string;
  name: string;
  reason: string;
};

export function recommendLuxuryTemplate(_listingId?: string): LuxuryTemplateRecommendation {
  return {
    templateId: "luxury-premium",
    name: "Luxury Premium",
    reason: "Best fit for high-end listings and affluent audiences.",
  };
}

export type LuxuryInsights = {
  luxuryAppealScore: number;
  suggestions: string[];
};

export function getLuxuryInsights(_listingId?: string): LuxuryInsights {
  return {
    luxuryAppealScore: 85,
    suggestions: [
      "Improve photography with professional staging and golden-hour shots.",
      "Add premium language: emphasize exclusivity, craftsmanship, and lifestyle.",
      "Target high-income audience with concierge and privacy messaging.",
    ],
  };
}

// ─── Broker ────────────────────────────────────────────────────────────────

export type BrokerNextAction = {
  action: string;
  messageSuggestion: string;
  closeProbabilityPct: number;
  priority: "high" | "medium" | "low";
};

export function suggestBrokerNextAction(lead: LeadInput): BrokerNextAction {
  const score = scoreLead(lead).score;
  const priority = score >= 70 ? "high" : score >= 40 ? "medium" : "low";
  return {
    action: "Follow up with a personalized message",
    messageSuggestion: "Thank you for your interest. I’d be happy to arrange a viewing at your convenience.",
    closeProbabilityPct: Math.min(90, score + 10),
    priority,
  };
}

// ─── Admin / alerts ─────────────────────────────────────────────────────────

export type AdminAiSummary = {
  alertsCount: number;
  fraudFlags: number;
  revenueOpportunitySummary: string;
};

export function getAdminAiSummary(): AdminAiSummary {
  return {
    alertsCount: 0,
    fraudFlags: 0,
    revenueOpportunitySummary: "No outstanding opportunities. Run reports for details.",
  };
}

// ─── Hub-specific fallback data (for SSR / no-API rendering) ──────────────

export type HubKey =
  | "bnhub"
  | "realEstate"
  | "luxury"
  | "broker"
  | "investments"
  | "admin";

export function getAiFallbacksForHub(hubKey: HubKey): Record<string, unknown> {
  switch (hubKey) {
    case "bnhub":
      return { pricing: suggestBnHubPricing("") };
    case "realEstate":
      return {
        listingScore: { score: 75, summary: "Good listing. Add more photos to improve." },
        marketing: generateMarketing({}),
      };
    case "luxury":
      return {
        template: recommendLuxuryTemplate(),
        insights: "Premium positioning and high-end copy perform best.",
      };
    case "broker":
      return {
        nextAction: suggestBrokerNextAction({}),
        closeProbability: 50,
      };
    case "investments":
      return { prediction: predictInvestmentPotential("") };
    case "admin":
      return { aiSummary: getAdminAiSummary() };
    default:
      return {};
  }
}
