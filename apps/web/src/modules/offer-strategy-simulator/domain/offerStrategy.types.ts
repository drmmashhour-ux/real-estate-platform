import { ImpactBand, SimulationConfidence } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.enums";

/** All money in cents. Dates ISO date strings (YYYY-MM-DD) or null. */
export type OfferScenarioInput = {
  propertyId: string;
  offerPriceCents: number;
  depositAmountCents: number | null;
  financingCondition: boolean;
  inspectionCondition: boolean;
  documentReviewCondition: boolean;
  occupancyDate: string | null;
  signatureDate: string | null;
  userStrategyMode: string | null;
};

export type ImpactVector = {
  score: number;
  band: ImpactBand;
  summary: string;
};

export type OfferSimulationResult = {
  dealImpact: ImpactVector;
  leverageImpact: ImpactVector;
  riskImpact: ImpactVector;
  readinessImpact: ImpactVector;
  recommendedStrategy: string;
  keyWarnings: string[];
  recommendedProtections: string[];
  nextActions: string[];
  confidence: SimulationConfidence;
  disclaimer: string;
};

export type ScenarioComparisonResult = {
  scenarios: Array<{ id: string; label: string; result: OfferSimulationResult }>;
  bestRiskAdjustedScenarioId: string;
  saferScenarioId: string;
  moreAggressiveScenarioId: string;
  tradeoffExplanation: string;
  confidence: SimulationConfidence;
  disclaimer: string;
};

export type ListingSimulationContext = {
  propertyId: string;
  listPriceCents: number;
  riskScore: number | null;
  trustScore: number | null;
  completenessPercent: number;
  blockerCount: number;
  warningCount: number;
  contradictionCount: number;
};
