export type RecommendationSource =
  | "ADS"
  | "RETARGETING"
  | "CRO"
  | "AB_TEST"
  | "PROFIT"
  | "PORTFOLIO"
  | "MARKETPLACE"
  | "UNIFIED";

export type RecommendationConfidence = "LOW" | "MEDIUM" | "HIGH";

export type OperatorActionType =
  | "SCALE_CAMPAIGN"
  | "PAUSE_CAMPAIGN"
  | "TEST_NEW_VARIANT"
  | "UPDATE_CTA_PRIORITY"
  | "UPDATE_RETARGETING_MESSAGE_PRIORITY"
  | "PROMOTE_EXPERIMENT_WINNER"
  | "REVIEW_LISTING"
  | "RECOMMEND_PRICE_CHANGE"
  | "BOOST_LISTING"
  | "DOWNRANK_LISTING"
  | "QUALITY_IMPROVEMENT"
  | "NO_ACTION"
  | "MONITOR";

export type AssistantRecommendation = {
  id: string;
  source: RecommendationSource;
  actionType: OperatorActionType;
  targetId?: string | null;
  targetLabel?: string | null;
  title: string;
  summary: string;
  reason: string;
  confidenceScore: number; // 0..1
  confidenceLabel: RecommendationConfidence;
  evidenceScore?: number | null;
  evidenceQuality?: "LOW" | "MEDIUM" | "HIGH" | null;
  expectedImpact?: string | null;
  operatorAction?: string | null;
  blockers?: string[];
  warnings?: string[];
  metrics?: Record<string, unknown>;
  createdAt: string;
};

export type RecommendationConflict = {
  targetId?: string | null;
  actionTypes: OperatorActionType[];
  sources: RecommendationSource[];
  severity: "LOW" | "MEDIUM" | "HIGH";
  reason: string;
  createdAt: string;
};

export type ApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "DISMISSED"
  | "EXPIRED"
  | "EXECUTED"
  | "BLOCKED";

export type OperatorApprovalRecord = {
  id: string;
  recommendationId: string;
  status: ApprovalStatus;
  reviewerUserId?: string | null;
  reviewerNote?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GuardrailEvaluation = {
  allowed: boolean;
  blockingReasons: string[];
  warnings: string[];
};
