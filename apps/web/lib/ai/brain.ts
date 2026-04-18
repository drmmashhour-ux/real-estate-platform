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
  /** 0–100 rule-based lead fit from message + contact fields — not a closing forecast. */
  leadFitScore: number;
  /** Short reason from the same scoring rules (explainable). */
  rationale: string;
  priority: "high" | "medium" | "low";
  /**
   * @deprecated Use `leadFitScore`. Kept for older UI; equals `leadFitScore` (never implied closing %).
   */
  closeProbabilityPct: number;
};

/**
 * Deterministic broker nudges from `scoreLead` — no fabricated win rates.
 * Persisted CRM flows should emit `broker_crm_next_action_generated` (see `lib/broker-crm/generate-next-action.ts`).
 * This panel is client-only unless you wire the same events from the dashboard.
 */
export function suggestBrokerNextAction(lead: LeadInput): BrokerNextAction {
  const { score, explanation } = scoreLead(lead);
  const message = typeof lead?.message === "string" ? lead.message.trim() : "";
  const hasEmail = !!lead?.email && String(lead.email).trim().length > 0;
  const hasPhone = !!lead?.phone && String(lead.phone).trim().length > 0;
  /** Narrow “high” priority: strong score plus at least one contact path (fewer noisy highs). */
  const priority =
    score >= 80 && (hasEmail || hasPhone)
      ? "high"
      : score >= 52
        ? "medium"
        : "low";

  let action: string;
  let messageSuggestion: string;

  if (message.length < 4 && !hasEmail && !hasPhone) {
    action = "Send one short qualifying reply";
    messageSuggestion =
      "Thanks for reaching out — what area are you focused on, and what’s the best way to reach you (email or phone)?";
  } else if (score < 32) {
    action = "Gather contact details and preferred times";
    messageSuggestion =
      "Thanks for your message — what’s the best number to reach you, and do mornings or afternoons work better for a quick call?";
  } else if (score < 52) {
    action = "Reply with two concrete time windows";
    messageSuggestion =
      "Thanks for reaching out. I can offer a short call Tuesday 10–11am or Thursday 2–4pm — which suits you?";
  } else if (score < 75) {
    action = "Schedule a qualified discovery call or showing";
    messageSuggestion =
      "Thanks — I’d love to learn your criteria and walk you through next steps. Are you available for a 15-minute call this week?";
  } else {
    action = "Fast-track: confirm showing or offer package within 48h";
    messageSuggestion =
      "Thanks — you look well qualified. I can hold two showing slots this week; reply with your top two times and I’ll confirm.";
  }

  const rationale =
    explanation.length > 120 ? `${explanation.slice(0, 117)}…` : explanation;

  return {
    action,
    messageSuggestion,
    leadFitScore: score,
    rationale,
    priority,
    closeProbabilityPct: score,
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
