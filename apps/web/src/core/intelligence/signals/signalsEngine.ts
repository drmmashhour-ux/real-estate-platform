import type { IntelligenceSignals, LeadSignalInput, ListingSignalInput, NormalizedSignalKey, SignalValue } from "@/src/core/intelligence/types/intelligence.types";

function clamp100(v: number) {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function signal(key: NormalizedSignalKey, value: number, reason: string): SignalValue {
  return { key, value: clamp100(value), reason };
}

export function buildListingSignals(input: ListingSignalInput): IntelligenceSignals {
  const marketRef = input.marketPriceCents ?? input.priceCents;
  const priceGap = marketRef > 0 ? ((marketRef - input.priceCents) / marketRef) * 100 : 0;
  const priceVsMarket = signal(
    "price_vs_market",
    50 + priceGap,
    priceGap >= 0 ? "Listed at or below local reference price" : "Listed above local reference price"
  );

  const rentalDemand = signal("rental_demand", input.rentalDemand ?? 55, "Rental demand from deterministic market inputs");
  const location = signal("location_score", input.locationScore ?? 55, "Location score from deterministic geo + listing factors");

  const trust = clamp100(input.trustScore ?? 50);
  const docs = signal("document_completeness", trust, trust >= 65 ? "Higher trust implies better listing completeness" : "Listing completeness needs verification");

  const risk = clamp100(input.riskScore ?? 40);
  const fraud = signal("fraud_risk_signal", risk, risk >= 70 ? "Elevated risk signal detected" : "No elevated fraud-risk signal");

  const freshnessDays = Math.max(0, input.freshnessDays ?? 7);
  const freshnessValue = freshnessDays <= 1 ? 100 : freshnessDays <= 3 ? 82 : freshnessDays <= 7 ? 64 : freshnessDays <= 14 ? 40 : 20;
  const freshness = signal("freshness_signal", freshnessValue, "Recency of listing update");

  const engagement = signal("engagement_signal", 55, "Neutral engagement baseline for listing context");

  return {
    price_vs_market: priceVsMarket,
    rental_demand: rentalDemand,
    location_score: location,
    document_completeness: docs,
    fraud_risk_signal: fraud,
    engagement_signal: engagement,
    freshness_signal: freshness,
  };
}

export function buildLeadSignals(input: LeadSignalInput): IntelligenceSignals {
  const engagement = signal("engagement_signal", input.engagementScore ?? 50, "Lead engagement from deterministic CRM events");
  const demand = signal("rental_demand", input.responseLikelihood ?? 50, "Response likelihood used as demand proxy in lead context");
  const location = signal("location_score", input.urgency ?? 50, "Urgency mapped to action priority signal");
  const docs = signal("document_completeness", input.dealSize ?? 50, "Deal size proxy for lead quality confidence");

  return {
    price_vs_market: signal("price_vs_market", 50, "Neutral in lead-only context"),
    rental_demand: demand,
    location_score: location,
    document_completeness: docs,
    fraud_risk_signal: signal("fraud_risk_signal", 35, "Default fraud baseline in lead context"),
    engagement_signal: engagement,
    freshness_signal: signal("freshness_signal", 65, "Recent CRM activity baseline"),
  };
}
