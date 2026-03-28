export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type StabilizationIssue = {
  severity: Severity;
  code: string;
  message: string;
  file?: string;
  detail?: string;
};

export type AuditResult = {
  name: string;
  issues: StabilizationIssue[];
  stats: Record<string, number | string | boolean>;
};

export type StabilizationReport = {
  generatedAt: string;
  webRoot: string;
  audits: AuditResult[];
  issuesBySeverity: Record<Severity, number>;
  criticalCount: number;
  productionReady: boolean;
  readinessBlockers?: string[];
};
