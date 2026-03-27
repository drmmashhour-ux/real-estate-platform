import { recordPlatformEvent } from "@/lib/observability";

export type TrustGraphAuditPayload =
  | {
      kind: "pipeline_run";
      caseId: string;
      entityType: string;
      entityId: string;
      overallScore: number;
      ruleVersion: string;
    }
  | {
      kind: "human_review";
      caseId: string;
      actionType: string;
      reviewerId: string;
      notes?: string | null;
    };

/** Typed audit facade over `recordPlatformEvent` — use from services in addition to inline pipeline logs. */
export async function recordTrustGraphAudit(payload: TrustGraphAuditPayload): Promise<void> {
  const base = {
    sourceModule: "trustgraph" as const,
    entityType: "VERIFICATION_CASE" as const,
  };

  if (payload.kind === "pipeline_run") {
    await recordPlatformEvent({
      ...base,
      eventType: "trustgraph_pipeline_run",
      entityId: payload.caseId,
      payload: {
        entityType: payload.entityType,
        entityId: payload.entityId,
        overallScore: payload.overallScore,
        ruleVersion: payload.ruleVersion,
      },
    }).catch(() => {});
    return;
  }

  await recordPlatformEvent({
    ...base,
    eventType: "trustgraph_human_review",
    entityId: payload.caseId,
    payload: {
      actionType: payload.actionType,
      reviewerId: payload.reviewerId,
      notes: payload.notes ?? undefined,
    },
  }).catch(() => {});
}
