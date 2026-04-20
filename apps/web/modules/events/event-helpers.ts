/**
 * Central mapping helpers — deterministic facts only.
 */

import { recordEvent, type RecordEventResult } from "./event.service";
import type { EventEntityType, EventRecordInput, EventType } from "./event.types";
import type { LegalHubReviewDecision } from "@/modules/legal/legal-hub-phase2.constants";
import { LEGAL_HUB_REVIEW_DECISION } from "@/modules/legal/legal-hub-phase2.constants";

export type RecordEventSafeFn = () => Promise<RecordEventResult>;

/** Fire-and-forget safe recorder — swallows errors; never throws. */
export async function recordEventSafe(fn: RecordEventSafeFn): Promise<void> {
  try {
    await fn();
  } catch {
    /* timeline must never break callers */
  }
}

export function buildEvent(input: EventRecordInput): EventRecordInput {
  return {
    entityType: input.entityType,
    entityId: input.entityId,
    eventType: input.eventType,
    actorId: input.actorId ?? null,
    actorType: input.actorType,
    metadata: sanitizeMeta(input.metadata),
  };
}

function sanitizeMeta(meta: Record<string, unknown> | null | undefined): Record<string, unknown> | undefined {
  if (!meta || typeof meta !== "object") return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean" || v === null) {
      out[k] = v;
    }
  }
  return Object.keys(out).length ? out : undefined;
}

export function mapLegalDocumentUploadToEvent(params: {
  documentId: string;
  actorId: string;
  actorType: string;
  workflowType: string;
  requirementId: string;
}): EventRecordInput {
  return buildEvent({
    entityType: "document",
    entityId: params.documentId,
    eventType: "document_uploaded",
    actorId: params.actorId,
    actorType: params.actorType,
    metadata: {
      workflowType: params.workflowType,
      requirementId: params.requirementId,
    },
  });
}

export function mapLegalDocumentSubmitToEvent(params: {
  documentId: string;
  actorId: string;
  actorType: string;
  workflowType: string;
  requirementId: string;
}): EventRecordInput {
  return buildEvent({
    entityType: "document",
    entityId: params.documentId,
    eventType: "document_submitted",
    actorId: params.actorId,
    actorType: params.actorType,
    metadata: {
      workflowType: params.workflowType,
      requirementId: params.requirementId,
    },
  });
}

export function mapLegalReviewDecisionToDocumentEvent(params: {
  documentId: string;
  reviewerUserId: string;
  reviewerActorType: string;
  decision: LegalHubReviewDecision;
  reasonSnippet?: string | null;
}): EventRecordInput {
  const approved = params.decision === LEGAL_HUB_REVIEW_DECISION.APPROVE;
  return buildEvent({
    entityType: "document",
    entityId: params.documentId,
    eventType: approved ? "document_approved" : "document_rejected",
    actorId: params.reviewerUserId,
    actorType: params.reviewerActorType,
    metadata: {
      phase: "review_completed",
      decision: params.decision,
      ...(params.reasonSnippet ? { reasonSnippet: params.reasonSnippet.slice(0, 280) } : {}),
    },
  });
}

export function mapWorkflowDraftCreatedToEvent(params: {
  workflowSubmissionId: string;
  actorId: string;
  actorType: string;
  workflowType: string;
}): EventRecordInput {
  return buildEvent({
    entityType: "workflow",
    entityId: params.workflowSubmissionId,
    eventType: "workflow_created",
    actorId: params.actorId,
    actorType: params.actorType,
    metadata: { workflowType: params.workflowType },
  });
}

export function mapWorkflowSubmittedToEvent(params: {
  workflowSubmissionId: string;
  actorId: string;
  actorType: string;
  workflowType: string;
}): EventRecordInput {
  return buildEvent({
    entityType: "workflow",
    entityId: params.workflowSubmissionId,
    eventType: "workflow_submitted",
    actorId: params.actorId,
    actorType: params.actorType,
    metadata: { workflowType: params.workflowType },
  });
}

export function mapWorkflowUnderReviewToEvent(params: {
  workflowSubmissionId: string;
  actorId: string;
  actorType: string;
  workflowType: string;
}): EventRecordInput {
  return buildEvent({
    entityType: "workflow",
    entityId: params.workflowSubmissionId,
    eventType: "workflow_under_review",
    actorId: params.actorId,
    actorType: params.actorType,
    metadata: { workflowType: params.workflowType },
  });
}

export function mapWorkflowReviewDecisionToEvent(params: {
  workflowId: string;
  reviewerUserId: string;
  reviewerActorType: string;
  decision: LegalHubReviewDecision;
  reasonSnippet?: string | null;
}): EventRecordInput {
  const approved = params.decision === LEGAL_HUB_REVIEW_DECISION.APPROVE;
  return buildEvent({
    entityType: "workflow",
    entityId: params.workflowId,
    eventType: approved ? "workflow_approved" : "workflow_rejected",
    actorId: params.reviewerUserId,
    actorType: params.reviewerActorType,
    metadata: {
      phase: "review_completed",
      decision: params.decision,
      ...(params.reasonSnippet ? { reasonSnippet: params.reasonSnippet.slice(0, 280) } : {}),
    },
  });
}

/** Maps autonomous marketplace target types to timeline entity typing. */
export function mapTargetToEventEntity(targetType: string): EventEntityType {
  if (targetType === "fsbo_listing" || targetType === "short_term_listing" || targetType === "syria_listing") {
    return "listing";
  }
  if (targetType === "broker_user") return "user";
  return "listing";
}

export function mapReviewCompletionMarker(params: {
  reviewEntityId: string;
  reviewerUserId: string;
  reviewerActorType: string;
  scope: "document" | "workflow";
  decision: string;
}): EventRecordInput {
  return buildEvent({
    entityType: "review",
    entityId: params.reviewEntityId,
    eventType: "review_completed",
    actorId: params.reviewerUserId,
    actorType: params.reviewerActorType,
    metadata: {
      scope: params.scope,
      decision: params.decision,
    },
  });
}

export function mapPolicyGovernanceOutcomeToEvents(params: {
  targetType: string;
  targetId: string | null;
  /** User or system actor for policy outcome */
  actorId: string | null;
  actorType: string;
  policyDisposition: string;
  governanceDisposition: string;
  executionStatus?: string | null;
}): EventRecordInput[] {
  const entityType = mapTargetToEventEntity(params.targetType);
  const entityId = params.targetId ?? "unknown";
  const out: EventRecordInput[] = [];

  if (params.policyDisposition === "BLOCK") {
    out.push(
      buildEvent({
        entityType,
        entityId,
        eventType: "action_blocked_by_policy",
        actorId: params.actorId,
        actorType: params.actorType,
        metadata: {
          governanceDisposition: params.governanceDisposition,
          executionStatus: params.executionStatus ?? null,
        },
      }),
    );
    return out;
  }

  if (params.executionStatus === "EXECUTED") {
    out.push(
      buildEvent({
        entityType,
        entityId,
        eventType: "action_allowed",
        actorId: params.actorId,
        actorType: params.actorType,
        metadata: {
          governanceDisposition: params.governanceDisposition,
          policyDisposition: params.policyDisposition,
        },
      }),
    );
  }

  return out;
}
