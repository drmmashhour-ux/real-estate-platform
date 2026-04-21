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
