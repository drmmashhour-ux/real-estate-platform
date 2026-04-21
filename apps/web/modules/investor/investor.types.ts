/** Semantic document versions (persisted on rows + embedded in payloads + PDF footers). */
export const INVESTOR_MEMO_VERSION = "v1.0.0";
export const INVESTOR_IC_PACK_VERSION = "v1.0.0";

export type InvestorMemoType = "PRELIMINARY" | "ACQUISITION" | "ESG" | "INVESTMENT_UPDATE";

export type DecisionRecommendation =
  | "PROCEED"
  | "PROCEED_WITH_CONDITIONS"
  | "HOLD"
  | "DECLINE";

export type ConfidenceTier = "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";

/** Memo payload embedded in JSON + UI + PDF */
export type InvestorMemoPayload = {
  schemaVersion: typeof INVESTOR_MEMO_VERSION;
  memoType: InvestorMemoType;
  generatedAt: string;
  listing: {
    id: string;
    title: string;
    city: string | null;
    province: string | null;
    buildingType: string;
    yearBuilt: number | null;
    area: string | null;
    askingPriceIfAvailable: number | null;
    /** When derived from listing.price */
    priceLabel: "LISTED_ASK" | "UNKNOWN";
  };
  dataGaps: string[];
  headline: {
    recommendation: DecisionRecommendation;
    confidenceLevel: ConfidenceTier;
    shortSummary: string;
  };
  executiveSummary: string;
  executiveSummaryBoard: string;
  strengths: string[];
  risks: string[];
  esgSummary: {
    esgScore: number | null;
    esgGrade: string | null;
    confidenceLevel: ConfidenceTier;
    evidenceCoveragePercent: number | null;
    topDrivers: string[];
    keyGaps: string[];
    carbonSummary: string;
    verifiedVsEstimatedNote: string;
  };
  acquisitionSummary: {
    acquisitionScore: number | null;
    acquisitionGrade: string | null;
    screenStatus: "PASS" | "CONDITIONAL" | "FAIL" | "UNKNOWN";
    investorFit: string | null;
    whyItPassesOrFails: string;
  };
  retrofitSummary: {
    planType: string | null;
    topActions: string[];
    costBand: string | null;
    impactBand: string | null;
    timelineBand: string | null;
  };
  financingSummary: {
    financingFit: string | null;
    topOptions: string[];
  };
  optimizerSummary: {
    selectedStrategy: string | null;
    objectiveMode: string | null;
    headline: string | null;
    topRecommendedActions: string[];
    expectedDirectionalImprovement: string | null;
  };
  keyAssumptions: string[];
  keyOpenQuestions: string[];
  nextSteps: string[];
  disclaimers: {
    verifiedVsEstimated: string;
    internalToolDisclaimer: string;
    adviceDisclaimer: string;
  };
  decisionTrace: {
    rationale: string;
    sourceSignals: string[];
  };
  partialOutput: boolean;
};

export type InvestorIcPackPayload = {
  schemaVersion: typeof INVESTOR_IC_PACK_VERSION;
  generatedAt: string;
  cover: {
    listingTitle: string;
    date: string;
    reportType: string;
    recommendation: DecisionRecommendation;
    confidenceLevel: ConfidenceTier;
    listingCode: string | null;
  };
  investmentThesis: {
    summary: string;
    whyNow: string;
    whyThisAsset: string;
    strategicFit: string;
  };
  assetSnapshot: {
    location: string;
    type: string;
    size: string | null;
    yearBuilt: number | null;
    assetHighlights: string[];
  };
  decisionFrame: {
    recommendation: DecisionRecommendation;
    proceedConditions: string[];
    noGoTriggers: string[];
  };
  riskAssessment: {
    criticalRisks: string[];
    highRisks: string[];
    mediumRisks: string[];
    mitigants: string[];
  };
  esgSection: {
    esgScore: number | null;
    confidenceLevel: ConfidenceTier;
    carbonSummary: string;
    evidenceStrength: string;
    redFlags: string[];
    opportunities: string[];
  };
  acquisitionSection: {
    acquisitionScore: number | null;
    screenStatus: "PASS" | "CONDITIONAL" | "FAIL" | "UNKNOWN";
    investorFit: string | null;
    blockers: string[];
    requiredDiligence: string[];
  };
  actionPlan: {
    topImmediateActions: string[];
    quickWins: string[];
    strategicActions: string[];
  };
  retrofitPlan: {
    selectedPlan: string | null;
    phaseRoadmap: string[];
    financingMatches: string[];
  };
  optimizerSection: {
    selectedStrategy: string | null;
    objectiveMode: string | null;
    topRecommendedActions: string[];
    expectedDirectionalImprovement: string | null;
  };
  finalRecommendation: {
    recommendation: DecisionRecommendation;
    rationale: string;
    requiredApprovals: string[];
    followUpItems: string[];
  };
  appendices: {
    methodologyNotes: string[];
    evidenceSummary: string[];
    scoringVersions: string[];
  };
  disclaimers: {
    verifiedVsEstimated: string;
    internalToolDisclaimer: string;
    adviceDisclaimer: string;
  };
  decisionTrace: {
    rationale: string;
    sourceSignals: string[];
  };
  partialOutput: boolean;
};
