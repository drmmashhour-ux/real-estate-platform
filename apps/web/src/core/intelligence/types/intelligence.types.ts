export type NormalizedSignalKey =
  | "price_vs_market"
  | "rental_demand"
  | "location_score"
  | "document_completeness"
  | "fraud_risk_signal"
  | "engagement_signal"
  | "freshness_signal";

export type SignalValue = {
  key: NormalizedSignalKey;
  value: number; // 0-100
  reason: string;
};

export type IntelligenceSignals = {
  [K in NormalizedSignalKey]: SignalValue;
};

export type IntelligenceScores = {
  dealScore: number;
  trustScore: number;
  riskScore: number;
  confidenceScore: number;
};

export type SelectionItem = {
  id: string;
  type: string;
  score: number;
  confidence: number;
  reasons: string[];
  recommendedAction: string;
};

export type IntelligenceSelection = {
  bestProperties: SelectionItem[];
  bestLeads: SelectionItem[];
  bestActions: SelectionItem[];
  bestStrategies: SelectionItem[];
};

export type IntelligenceExplanation = {
  short: string;
  keyFactors: string[];
  recommendedAction: string;
};

export type UnifiedIntelligence = {
  signals: IntelligenceSignals;
  scores: IntelligenceScores;
  selection: IntelligenceSelection;
  explanation: IntelligenceExplanation;
  confidence: number;
};

export type ListingSignalInput = {
  priceCents: number;
  marketPriceCents?: number | null;
  rentalDemand?: number | null; // 0-100
  locationScore?: number | null; // 0-100
  trustScore?: number | null; // 0-100
  riskScore?: number | null; // 0-100
  freshnessDays?: number | null;
};

export type LeadSignalInput = {
  engagementScore?: number | null; // 0-100
  responseLikelihood?: number | null; // 0-100
  urgency?: number | null; // 0-100
  dealSize?: number | null; // 0-100 normalized
};
