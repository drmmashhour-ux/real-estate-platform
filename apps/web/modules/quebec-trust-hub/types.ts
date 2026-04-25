export type TrustHubStatus = "LOW" | "MEDIUM" | "HIGH" | "READY";

export interface ComplianceScoreResult {
  score: number;
  status: TrustHubStatus;
  missingItems: string[];
  riskItems: string[];
  recommendations: string[];
}

export interface TrustHubBadgeInfo {
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
  risksFr: string[];
  whatToConfirmFr: string[];
  plainLanguageSummaryFr: string;
}

export interface ProtectionModeStatus {
  enabled: boolean;
  reasons: string[];
}
