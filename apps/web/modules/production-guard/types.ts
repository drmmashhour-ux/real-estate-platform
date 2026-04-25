export interface ValidationResult {
  valid: boolean;
  errors: string[];
  blockingReasons: string[];
}

export interface GuardConfig {
  productionMode: boolean;
  minComplianceScore: number;
}
