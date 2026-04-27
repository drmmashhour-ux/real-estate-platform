export type DrBrainAppId = "lecipm" | "syria" | "hadialink";

export type DrBrainEnv = "development" | "staging" | "production";

export type DrBrainLevel = "OK" | "INFO" | "WARNING" | "CRITICAL";

export type DrBrainCheckResult = {
  appId: DrBrainAppId;
  check: string;
  level: DrBrainLevel;
  ok: boolean;
  message: string;
  metadata?: Record<string, unknown>;
};

export type DrBrainTicketSeverity = "INFO" | "WARNING" | "CRITICAL";

export type DrBrainTicketCategory =
  | "DATABASE"
  | "PAYMENTS"
  | "FRAUD"
  | "PERFORMANCE"
  | "SECURITY"
  | "SYSTEM";

export type DrBrainTicketStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "IGNORED";

export type DrBrainTicket = {
  id: string;
  appId: DrBrainAppId;
  appEnv: DrBrainEnv;
  severity: DrBrainTicketSeverity;
  category: DrBrainTicketCategory;
  title: string;
  description: string;
  recommendedActions: string[];
  status: DrBrainTicketStatus;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
};

export type DrBrainReport = {
  appId: DrBrainAppId;
  appEnv: DrBrainEnv;
  status: "OK" | "WARNING" | "CRITICAL";
  results: DrBrainCheckResult[];
  recommendations: string[];
  timestamp: string;
  /** Tickets emitted during this run (CRITICAL auto; WARNING after repeat). Empty when skipped / demo. */
  ticketsEmitted?: DrBrainTicket[];
};

export type RunDrBrainFlags = {
  /** Skip SYBNB/payment-oriented checks (non-marketplace apps). */
  skipPayments?: boolean;
  /** Skip heavy local build/typecheck subprocess (default true for CLI speed). */
  skipBuild?: boolean;
  /** Skip optional performance hints. */
  skipPerformance?: boolean;
  /**
   * When true, {@link runDrBrainForApp} does not set runtime kill-switch env vars on payments CRITICAL
   * (Syria may use app-local rate-limited auto-protection instead).
   */
  disableRuntimeKillSwitchArming?: boolean;
  /** Investor dashboard simulation — no alerts, tickets, or kill-switch side effects. */
  drbrainInvestorDemoMode?: boolean;
  /** Skip ticket emission (e.g. CLI / tests). */
  skipTickets?: boolean;
};

export type RunDrBrainForAppInput = {
  appId: DrBrainAppId;
  /** Isolated env snapshot for this app — never reuse another app's DATABASE_URL */
  env: Record<string, string | undefined>;
  /** Optional DB probe — must use this app's Prisma/client only */
  dbPing?: () => Promise<boolean>;
  /** Optional anomaly hooks implemented inside each app */
  anomalyChecks?: () => Promise<DrBrainCheckResult[]>;
  flags?: RunDrBrainFlags;
  /** Monorepo paths for optional DRBRAIN_INCLUDE_BUILD subprocess checks */
  workspacePaths?: {
    monorepoRoot: string;
    appRelativeDir: string;
  };
};
