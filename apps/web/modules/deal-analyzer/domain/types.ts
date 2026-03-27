import type { ConfidenceLevel, DealRecommendation, OpportunityType } from "@/modules/deal-analyzer/domain/enums";

/** Inputs gathered from platform (no external APIs in Phase 1). */
export type DealAnalyzerListingInput = {
  listingId: string;
  priceCents: number;
  surfaceSqft: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  city: string;
  propertyType: string | null;
  trustScore: number | null;
  riskScore: number | null;
  /** Days since last update */
  listingAgeDays: number;
  /** 0–1 ratio of required seller documents present */
  documentCompleteness: number;
  /** 0–1 declaration completeness */
  declarationCompleteness: number;
  /** Verification case trust level string if any */
  caseTrustLevel: string | null;
  caseReadinessLevel: string | null;
  /** Whether TrustGraph case exists */
  hasVerificationCase: boolean;
};

export type ComponentScores = {
  trustComponent: number;
  pricingComponent: number;
  readinessComponent: number;
  incomeComponent: number | null;
  marketComponent: number;
  /** Inverse: high = bad */
  riskComponent: number;
};

export type DealAnalysisResult = {
  investmentScore: number;
  riskScore: number;
  confidenceLevel: ConfidenceLevel;
  recommendation: DealRecommendation;
  opportunityType: OpportunityType;
  reasons: string[];
  warnings: string[];
  components: ComponentScores;
  factors: {
    factorCode: string;
    factorCategory: string;
    factorValue: number;
    weight: number;
    impact: "positive" | "negative" | "neutral";
    /** Serializable factor context */
    details: Record<string, unknown>;
  }[];
  scenarioPreview: {
    scenarioType: string;
    monthlyRent: number | null;
    occupancyRate: number | null;
    monthlyCashFlow: number | null;
    annualRoiPercent: number | null;
    capRatePercent: number | null;
    note: string | null;
  } | null;
};
