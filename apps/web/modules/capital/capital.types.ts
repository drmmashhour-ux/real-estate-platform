export const LENDER_PACKAGE_VERSION = "v1.0.0";

export type CapitalStrategyType = "CONSERVATIVE" | "BALANCED" | "AGGRESSIVE";

export type StackEngineResult = {
  totalCapitalRequired: number | null;
  seniorDebtTarget: number | null;
  mezzanineTarget: number | null;
  preferredEquityTarget: number | null;
  commonEquityTarget: number | null;
  rationale: string[];
  warnings: string[];
  dataGaps: string[];
};

export type LenderPackagePayload = {
  schemaVersion: typeof LENDER_PACKAGE_VERSION;
  generatedAt: string;
  cover: {
    dealTitle: string;
    date: string;
    requestedFinancingType: string;
    targetCapitalStackSummary: string;
  };
  executiveSummary: {
    shortNarrative: string;
    recommendation: string;
    confidenceLevel: string;
  };
  assetOverview: Record<string, unknown>;
  financingRequest: {
    capitalRequired: number | null;
    targetStructure: string;
    purposeOfFunds: string;
    requestedTermsNotes: string;
  };
  investmentCase: {
    strengths: string[];
    mitigants: string[];
    strategicPositioning: string[];
  };
  esgSection: {
    score: string;
    confidence: string;
    evidenceStrength: string;
    retrofitPlan: string;
    financingRelevance: string;
  };
  diligenceStatus: {
    completedItems: string[];
    openItems: string[];
    criticalConditions: string[];
  };
  appendices: {
    memoReference: string | null;
    icPackReference: string | null;
    evidenceSummary: string;
    versions: string[];
  };
  disclaimers: {
    verifiedVsEstimated: string;
    lenderSafe: string;
  };
};

export type OfferComparisonResult = {
  offers: Array<{ id: string; label: string; scoreHint: number }>;
  ranking: string[];
  strongestOfferId: string | null;
  lowestConstraintOfferId: string | null;
  mostFlexibleOfferId: string | null;
  highestExecutionRiskOfferId: string | null;
  explanation: string[];
};

export type ClosingReadinessResult = {
  readinessStatus: "NOT_READY" | "PARTIALLY_READY" | "READY";
  blockers: string[];
  completedItems: string[];
  nextCriticalSteps: string[];
};
