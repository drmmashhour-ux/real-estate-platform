export type ComplianceStatus = "LOW" | "MEDIUM" | "HIGH" | "READY";

export interface ComplianceScoreResult {
  score: number;
  status: ComplianceStatus;
  missingItems: string[];
  riskItems: string[];
  recommendations: string[];
}

export interface TrustBadge {
  badgeKey: string;
  labelFr: string;
  proofJson?: any;
}

export interface SaferChoice {
  issueKey: string;
  currentRisk: string;
  saferOptionFr: string;
  reasonFr: string;
  actionRequired: boolean;
}

export interface ClauseExplanation {
  explanationFr: string;
  risksFr: string;
  whatToConfirmFr: string;
  plainLanguageSummaryFr: string;
  disclaimerFr: string;
}

export interface ProtectionModeStatus {
  enabled: boolean;
  reasonsFr: string[];
  recommendedActionsFr: string[];
}
