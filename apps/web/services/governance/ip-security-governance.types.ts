export type TrademarkStatus = "manual_review_required" | "not_assessed";

export type IpSecurityGovernanceSnapshot = {
  legal: {
    termsOfServicePresent: boolean;
    privacyPolicyPresent: boolean;
    ndaTemplatesPresent: boolean;
    acceptableUsePresent: boolean;
    law25ChecklistPresent: boolean;
  };
  ip: {
    ipChecklistPresent: boolean;
    proprietaryLogicProtected: boolean;
    proprietaryLogicHeuristicNote: string;
    trademarkStatus: TrademarkStatus;
  };
  security: {
    apiSecurityReviewed: boolean;
    authReviewDone: boolean;
    stripeSecurityReviewed: boolean;
    dbSecurityReviewed: boolean;
    aiAdminReviewDone: boolean;
    secretsChecklistDone: boolean;
    derivationNotes: string[];
  };
  production: {
    productionReadyScore: number | null;
    productionReadyNote: string | null;
    criticalIncidentsCount: number;
    alertCount: number;
    incidentsNote: string;
  };
  summary: {
    overallRiskLevel: "low" | "medium" | "high";
    criticalGaps: string[];
    warnings: string[];
  };
  meta: {
    generatedAt: string;
    repoRootUsed: string;
    docsReadable: boolean;
  };
};
