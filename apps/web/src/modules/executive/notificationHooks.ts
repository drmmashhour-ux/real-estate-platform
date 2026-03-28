import { logActionRun } from "@/src/modules/executive/autoActionEngine";

/** Critical recommendation — audit trail for admins (no separate notifications table). */
export async function notifyAdminOfCriticalRecommendation(params: {
  recommendationId: string;
  title: string;
  priorityScore: number;
}): Promise<void> {
  await logActionRun({
    actionKey: "executive_critical_recommendation",
    recommendationId: params.recommendationId,
    resultStatus: "success",
    resultJson: {
      title: params.title,
      priorityScore: params.priorityScore,
      channel: "admin_executive_feed",
    },
  });
}

export async function createInternalReviewTask(params: {
  kind: "city" | "listing" | "broker" | "host" | "global";
  entityId?: string;
  note: string;
  recommendationId?: string;
}): Promise<void> {
  await logActionRun({
    actionKey: "executive_internal_review_task",
    recommendationId: params.recommendationId,
    resultStatus: "success",
    resultJson: {
      kind: params.kind,
      entityId: params.entityId ?? null,
      note: params.note,
    },
  });
}

export async function logBrokerHostReviewRequirement(params: {
  entityType: "broker" | "host";
  entityId: string;
  reason: string;
  recommendationId?: string;
}): Promise<void> {
  await logActionRun({
    actionKey: "executive_broker_host_review",
    recommendationId: params.recommendationId,
    resultStatus: "success",
    resultJson: {
      entityType: params.entityType,
      entityId: params.entityId,
      reason: params.reason,
    },
  });
}
