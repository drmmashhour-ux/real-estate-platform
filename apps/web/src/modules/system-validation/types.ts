export type FlowId =
  | "auth_landing_signup_dashboard"
  | "property_search_simulator"
  | "watchlist_alerts"
  | "ai_selection_next_action_scoring"
  | "legal_declaration_draft"
  | "negotiation_chain"
  | "case_command_center"
  | "growth_content"
  | "billing_upgrade_simulation"
  | "retention_referral"
  | "crm_lead";

export type FlowRunResult = {
  flowId: FlowId;
  ok: boolean;
  durationMs: number;
  detail?: string;
};

export type ValidationError = {
  type: "api" | "state" | "data" | "ui" | "unknown";
  flowId?: FlowId;
  message: string;
  location?: string;
  reproduction?: string[];
};

export type PerformanceSample = {
  label: string;
  durationMs: number;
  slow?: boolean;
};

export type ConversionMetrics = {
  activationRate: number;
  simulatorRunsObserved: number;
  dropOffStage: string | null;
  upgradeTriggerObserved: boolean;
  conversionSimulated: boolean;
};

export type SystemValidationReport = {
  generatedAt: string;
  environment: {
    testMode: boolean;
    nodeEnv: string | null;
    stripeSandboxOnly: boolean;
    notes: string[];
  };
  usersCreated: number;
  userSummaries: Array<{ email: string; role: string; plan: string }>;
  fixtureIds?: {
    listingId: string;
    declarationDraftId: string;
    propertyIdentityId?: string;
    transactionId?: string;
  };
  flows: FlowRunResult[];
  flowSuccessRate: Record<string, number>;
  errors: ValidationError[];
  performance: PerformanceSample[];
  scaling?: {
    concurrentTasks: number;
    totalDurationMs: number;
    failures: number;
    p95Ms?: number;
  };
  conversion: ConversionMetrics;
  recommendations: string[];
};
