import type {
  CommandCenterAlertSeverity,
  CommandCenterAlertType,
  CommandCenterRecommendationCategory,
  PlatformRole,
} from "@prisma/client";
import type { CommandCenterPagePayload } from "./command-center.types";

export type CommandPriorityBucket =
  | "ACT_NOW"
  | "REVIEW_TODAY"
  | "WAITING_FOR_OTHERS"
  | "AI_ALREADY_HANDLED"
  | "LOW_PRIORITY";

export type PriorityItem = {
  id: string;
  title: string;
  detail?: string;
  href?: string;
  urgencyScore: number;
  valueScore: number;
  explainability: string[];
};

export type CommandPriorityBuckets = Record<CommandPriorityBucket, PriorityItem[]>;

export type SignatureQueueItem = {
  kind: "offer" | "contract" | "investor_packet" | "closing_step" | "financial" | "action_pipeline";
  id: string;
  title: string;
  dealId?: string | null;
  href: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
};

export type ExecutionVisibilityItem = {
  id: string;
  kind: string;
  status: string;
  title: string;
  dealId?: string | null;
  href?: string;
  aiGenerated?: boolean;
  retriable?: boolean;
  blockedReason?: string | null;
};

export type DealCommandRow = {
  dealId: string;
  dealCode: string | null;
  stage: string;
  crmStage: string | null;
  priceCents: number;
  dealScore: number | null;
  dealScoreCategory: string | null;
  riskLevel: string | null;
  closeProbability: number | null;
  closeCategory: string | null;
  blocker: string | null;
  nextStep: string | null;
  nextOwner: string | null;
  needsBrokerSignature: boolean;
  href: string;
};

export type ClosingCommandRow = {
  dealId: string;
  closingStatus: string | null;
  readiness: string | null;
  closingDate: string | null;
  pendingSignatures: number;
  openChecklist: number;
  blockedChecklist: number;
  href: string;
};

export type InvestorCommandRow = {
  id: string;
  title: string;
  stage: string;
  decisionStatus: string;
  listingId: string | null;
  href: string;
};

export type FinanceCommandSummary = {
  invoicesOpen: number;
  invoicesOverdue: number;
  recentInvoices: Array<{
    id: string;
    invoiceNumber: string;
    status: string;
    totalAmount: number;
    dueAt: string | null;
    href: string;
  }>;
  taxHint: string | null;
};

export type UnifiedCommandContext = {
  userId: string;
  role: PlatformRole;
  generatedAt: string;
  legacy: CommandCenterPagePayload;
  signatureQueue: SignatureQueueItem[];
  execution: {
    aiHandled: ExecutionVisibilityItem[];
    failedOrBlocked: ExecutionVisibilityItem[];
  };
  deals: DealCommandRow[];
  closings: ClosingCommandRow[];
  investors: InvestorCommandRow[];
  finance: FinanceCommandSummary;
  hotOpportunities: Array<{ id: string; label: string; href: string; kind: "deal" | "lead" | "listing" }>;
  conflictDeals: number;
};

/** Serializable alert row produced by the alert engine (matches `CommandCenterAlert` create shape). */
export type EngineAlert = {
  type: CommandCenterAlertType;
  severity: CommandCenterAlertSeverity;
  entityType: string;
  entityId: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionUrl?: string;
};

export type RecommendationReasoning = {
  why: string;
  expectedImpact: string;
  riskOrBlocker: string;
  explainability: string[];
};

export type EngineRecommendation = {
  category: CommandCenterRecommendationCategory;
  entityType: string;
  entityId: string;
  score: number;
  reasoningJson: RecommendationReasoning;
};

export type CommandCenterAiPayload = {
  context: UnifiedCommandContext;
  priorities: CommandPriorityBuckets;
  alerts: EngineAlert[];
  recommendations: EngineRecommendation[];
  snapshot: { id: string; generatedAt: string } | null;
};
