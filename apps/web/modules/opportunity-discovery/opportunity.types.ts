import type {
  LecipmDiscoveryEntityType,
  LecipmOpportunityKind,
  LecipmOpportunityRiskTier,
} from "@prisma/client";

export type OpportunityRationale = {
  summary: string;
  explainability: string[];
  dataQuality: "high" | "medium" | "low";
  disclaimers: string[];
  signals: Record<string, string | number | boolean | null>;
  riskFlags: string[];
};

export type DiscoveredOpportunity = {
  entityType: LecipmDiscoveryEntityType;
  entityId: string;
  opportunityType: LecipmOpportunityKind;
  score: number;
  confidenceScore: number;
  riskLevel: LecipmOpportunityRiskTier;
  rationale: OpportunityRationale;
  suggestedNextActions: string[];
  city?: string | null;
  propertyType?: string | null;
  marketSegment?: string | null;
  investorReady?: boolean;
  esgRelevant?: boolean;
};

export type OpportunityDiscoveryWeights = {
  valueGap: number;
  conversion: number;
  urgency: number;
  financing: number;
  esgUpside: number;
  investorMatch: number;
  bookingUpside: number;
  riskPenalty: number;
};

export const DEFAULT_OPPORTUNITY_WEIGHTS: OpportunityDiscoveryWeights = {
  valueGap: 0.22,
  conversion: 0.2,
  urgency: 0.12,
  financing: 0.1,
  esgUpside: 0.12,
  investorMatch: 0.12,
  bookingUpside: 0.12,
  riskPenalty: 0.18,
};

export type OpportunityDiscoveryOptions = {
  brokerUserId: string;
  persist?: boolean;
  weights?: Partial<OpportunityDiscoveryWeights>;
  intentBoost?: number;
};
