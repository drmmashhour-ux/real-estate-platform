export type InsuranceStatus = "ACTIVE" | "EXPIRED" | "SUSPENDED";

export type InsuranceClaimStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "CLOSED";

export type ComplianceEventType = "RISK" | "WARNING" | "VIOLATION";

export type RiskSeverity = "LOW" | "MEDIUM" | "HIGH";

export type InsuranceRiskEngineResult = {
  riskScore: number;
  flags: string[];
  severity: RiskSeverity;
};

export type BrokerInsuranceCard = {
  id: string;
  policyNumber: string | null;
  provider: string;
  coveragePerLoss: number;
  coveragePerYear: number;
  startDate: string;
  endDate: string;
  status: string;
  deductibleLevel: number;
};

export type InsuranceStatusResponse = {
  hasPolicy: boolean;
  status: InsuranceStatus | "NONE";
  policy: BrokerInsuranceCard | null;
  message: string;
};

export type ComplianceScoreResponse = {
  score: number;
  max: number;
  label: string;
  openRisks: number;
  lastEventAt: string | null;
};

/** Public API (GET /api/insurance/coverage) — no PII, no policy number. */
export type PublicBrokerCoverageResponse = {
  liabilityAmount: number;
  coverageType: "PROFESSIONAL_LIABILITY";
  expiryDate: string;
  status: string;
  nearExpiry: boolean;
};

/** Minimum per-occurrence limit (CAD cents) for “valid / Insured” trust + marketplace filters. */
export const MIN_PROFESSIONAL_LIABILITY_COVERAGE_CAD = 1_000_000;

/** Deterministic risk engine score at or above which proactive alerts fire. */
export const INSURANCE_RISK_ALERT_THRESHOLD = 70;

/**
 * Logical “compliance event” row — persisted as Prisma `BrokerComplianceEvent`
 * (`broker_compliance_events`).
 */
export type ComplianceEventRecord = {
  brokerId: string;
  type: ComplianceEventType;
  message: string;
  severity: RiskSeverity;
};
