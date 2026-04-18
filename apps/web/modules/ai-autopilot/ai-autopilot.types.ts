import type {
  AutopilotMode,
  PlatformAutopilotActionStatus,
  PlatformAutopilotRiskClass,
} from "@prisma/client";

export type AutopilotDomain =
  | "bnhub"
  | "listing"
  | "growth"
  | "lead_crm"
  | "broker_deal"
  | "founder_admin"
  | "fraud_trust"
  | "marketplace_intelligence";

export type NormalizedSignal = {
  domain: AutopilotDomain;
  signalType: string;
  entityType: string;
  entityId: string | null;
  severity: "info" | "low" | "medium" | "high" | "critical";
  confidence: number;
  metadata: Record<string, unknown>;
  timestamp: string;
};

export type ProposedAction = {
  domain: AutopilotDomain;
  entityType: string;
  entityId: string | null;
  actionType: string;
  title: string;
  summary: string;
  severity: string;
  riskLevel: PlatformAutopilotRiskClass;
  recommendedPayload: Record<string, unknown>;
  reasons: Record<string, unknown>;
  subjectUserId: string | null;
  audience: "host" | "broker" | "admin" | "founder" | "seller" | null;
};

export type RankBucket = "do_now" | "do_today" | "do_this_week" | "observe_only";

export type RankedAction = ProposedAction & {
  bucket: RankBucket;
  score: number;
  explainSummary: string;
  confidence: number;
};

export type AutopilotRunContext = {
  actorUserId: string;
  mode: AutopilotMode;
  /** When true, persist rows and allow safe auto-execution for LOW risk */
  persist: boolean;
};

export type { AutopilotMode, PlatformAutopilotActionStatus, PlatformAutopilotRiskClass };
