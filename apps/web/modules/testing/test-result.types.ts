export type TunnelStatus = "PASS" | "FAIL" | "WARNING";

export type TunnelStepLog = {
  step: string;
  at: string;
  level: "info" | "warn" | "error";
  message: string;
  detail?: string;
};

export type TunnelTestResult = {
  id: string;
  name: string;
  status: TunnelStatus;
  steps: TunnelStepLog[];
  errors: string[];
  logs: string[];
  /** When true, failure forces NO_GO recommendation. */
  critical: boolean;
};

export type FinalValidationReport = {
  generatedAt: string;
  totalTests: number;
  passed: number;
  failed: number;
  warnings: number;
  criticalFailures: { id: string; name: string; errors: string[] }[];
  results: TunnelTestResult[];
  recommendation: "GO" | "NO_GO";
  /** Human-readable; never fabricate pass counts. */
  notes: string[];
};
