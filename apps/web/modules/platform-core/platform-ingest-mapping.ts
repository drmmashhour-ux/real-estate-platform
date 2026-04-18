import type { AssistantRecommendation } from "@/modules/operator/operator.types";
import type { CoreDecisionStatus, CoreEntityType, CoreSystemSource } from "./platform-core.types";

const ACTION_ENTITY: Record<string, CoreEntityType> = {
  SCALE_CAMPAIGN: "CAMPAIGN",
  PAUSE_CAMPAIGN: "CAMPAIGN",
  TEST_NEW_VARIANT: "EXPERIMENT",
  UPDATE_CTA_PRIORITY: "SURFACE",
  UPDATE_RETARGETING_MESSAGE_PRIORITY: "MESSAGE",
  PROMOTE_EXPERIMENT_WINNER: "EXPERIMENT",
  REVIEW_LISTING: "LISTING",
  RECOMMEND_PRICE_CHANGE: "LISTING",
  BOOST_LISTING: "LISTING",
  DOWNRANK_LISTING: "LISTING",
  QUALITY_IMPROVEMENT: "LISTING",
  NO_ACTION: "UNKNOWN",
  MONITOR: "UNKNOWN",
};

export function mapAssistantSourceToCore(
  s: AssistantRecommendation["source"],
): CoreSystemSource {
  if (s === "UNIFIED") return "UNIFIED";
  return s as CoreSystemSource;
}

export function entityTypeForAction(actionType: string): CoreEntityType {
  return ACTION_ENTITY[actionType] ?? "UNKNOWN";
}

export function decisionStatusFromAssistant(r: AssistantRecommendation): CoreDecisionStatus {
  if (r.actionType === "MONITOR" || r.actionType === "NO_ACTION") return "MONITORING";
  return "PENDING";
}

export function assistantRecommendationToCoreFields(r: AssistantRecommendation): {
  source: CoreSystemSource;
  entityType: CoreEntityType;
  entityId: string | null;
  title: string;
  summary: string;
  reason: string;
  confidenceScore: number;
  evidenceScore: number | null;
  status: CoreDecisionStatus;
  actionType: string;
  expectedImpact: string | null;
  warnings: string[] | undefined;
  blockers: string[] | undefined;
  metadata: Record<string, unknown>;
} {
  return {
    source: mapAssistantSourceToCore(r.source),
    entityType: entityTypeForAction(r.actionType),
    entityId: r.targetId ?? null,
    title: r.title,
    summary: r.summary,
    reason: r.reason,
    confidenceScore: r.confidenceScore,
    evidenceScore: r.evidenceScore ?? null,
    status: decisionStatusFromAssistant(r),
    actionType: r.actionType,
    expectedImpact: r.expectedImpact ?? null,
    warnings: r.warnings,
    blockers: r.blockers,
    metadata: {
      assistantRecommendationId: r.id,
      confidenceLabel: r.confidenceLabel,
      evidenceQuality: r.evidenceQuality,
      metrics: r.metrics,
      targetLabel: r.targetLabel,
    },
  };
}
