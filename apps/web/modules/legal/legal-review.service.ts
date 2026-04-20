import { PlatformRole } from "@prisma/client";
import { eventTimelineFlags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import {
  mapLegalReviewDecisionToDocumentEvent,
  mapReviewCompletionMarker,
  mapWorkflowReviewDecisionToEvent,
  recordEventSafe,
} from "@/modules/events/event-helpers";
import { recordEvent } from "@/modules/events/event.service";
import { logLegalAction } from "@/modules/legal/legal-audit.service";
import {
  LEGAL_HUB_AUDIT_ACTION,
  LEGAL_HUB_AUDIT_ENTITY,
  LEGAL_HUB_DOCUMENT_STATUS,
  LEGAL_HUB_REVIEW_DECISION,
  LEGAL_HUB_WORKFLOW_STATUS,
  type LegalHubReviewDecision,
} from "@/modules/legal/legal-hub-phase2.constants";

function reviewerActorLabel(role: PlatformRole): string {
  if (role === PlatformRole.ADMIN) return "admin";
  if (role === PlatformRole.BROKER) return "broker";
  return "reviewer";
}

export type PendingReviewSnapshot = {
  pendingDocuments: Array<{
    id: string;
    userId: string | null;
    workflowType: string;
    requirementId: string;
    actorType: string;
    status: string;
    fileName: string;
    fileType: string;
    uploadedAt: string;
    workflowSubmissionId: string | null;
  }>;
  pendingWorkflows: Array<{
    id: string;
    userId: string | null;
    workflowType: string;
    actorType: string;
    status: string;
    submittedAt: string | null;
  }>;
};

export async function getPendingReviewQueue(): Promise<PendingReviewSnapshot> {
  try {
    const [pendingDocuments, pendingWorkflows] = await Promise.all([
      prisma.legalHubSubmissionDocument.findMany({
        where: {
          status: LEGAL_HUB_DOCUMENT_STATUS.SUBMITTED,
          OR: [
            { workflowSubmissionId: null },
            {
              workflowSubmission: {
                status: { not: LEGAL_HUB_WORKFLOW_STATUS.UNDER_REVIEW },
              },
            },
          ],
        },
        orderBy: { submittedAt: "asc" },
        take: 200,
        select: {
          id: true,
          userId: true,
          workflowType: true,
          requirementId: true,
          actorType: true,
          status: true,
          fileName: true,
          fileType: true,
          uploadedAt: true,
          workflowSubmissionId: true,
        },
      }),
      prisma.legalWorkflowSubmission.findMany({
        where: { status: LEGAL_HUB_WORKFLOW_STATUS.UNDER_REVIEW },
        orderBy: { submittedAt: "asc" },
        take: 100,
        select: {
          id: true,
          userId: true,
          workflowType: true,
          actorType: true,
          status: true,
          submittedAt: true,
        },
      }),
    ]);

    return {
      pendingDocuments: pendingDocuments.map((d) => ({
        ...d,
        uploadedAt: d.uploadedAt.toISOString(),
      })),
      pendingWorkflows: pendingWorkflows.map((w) => ({
        ...w,
        submittedAt: w.submittedAt?.toISOString() ?? null,
      })),
    };
  } catch {
    return { pendingDocuments: [], pendingWorkflows: [] };
  }
}

export async function reviewDocument(params: {
  reviewerUserId: string;
  reviewerRole: PlatformRole;
  documentId: string;
  decision: LegalHubReviewDecision;
  reason?: string | null;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const reasonTrimmed = params.reason?.trim() ?? "";

  if (params.decision === LEGAL_HUB_REVIEW_DECISION.REJECT && !reasonTrimmed) {
    return { ok: false, message: "Rejection requires a reason" };
  }

  try {
    const doc = await prisma.legalHubSubmissionDocument.findUnique({
      where: { id: params.documentId },
    });

    if (!doc) {
      return { ok: false, message: "Document not found" };
    }
    if (doc.status !== LEGAL_HUB_DOCUMENT_STATUS.SUBMITTED) {
      return { ok: false, message: "Document is not awaiting review" };
    }

    const now = new Date();
    const nextStatus =
      params.decision === LEGAL_HUB_REVIEW_DECISION.APPROVE
        ? LEGAL_HUB_DOCUMENT_STATUS.APPROVED
        : LEGAL_HUB_DOCUMENT_STATUS.REJECTED;

    await prisma.legalHubSubmissionDocument.update({
      where: { id: doc.id },
      data: {
        status: nextStatus,
        reviewedAt: now,
        reviewedBy: params.reviewerUserId,
        rejectionReason:
          params.decision === LEGAL_HUB_REVIEW_DECISION.REJECT ? reasonTrimmed : null,
      },
    });

    await logLegalAction({
      entityType: LEGAL_HUB_AUDIT_ENTITY.DOCUMENT,
      entityId: doc.id,
      action:
        params.decision === LEGAL_HUB_REVIEW_DECISION.APPROVE
          ? LEGAL_HUB_AUDIT_ACTION.APPROVE
          : LEGAL_HUB_AUDIT_ACTION.REJECT,
      actorId: params.reviewerUserId,
      actorType: reviewerActorLabel(params.reviewerRole),
      metadata: {
        decision: params.decision,
        status: nextStatus,
        ...(reasonTrimmed ? { reason: reasonTrimmed.slice(0, 2000) } : {}),
      },
    });

    return { ok: true };
  } catch {
    return { ok: false, message: "Review failed" };
  }
}

export async function reviewWorkflow(params: {
  reviewerUserId: string;
  reviewerRole: PlatformRole;
  workflowId: string;
  decision: LegalHubReviewDecision;
  reason?: string | null;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const reasonTrimmed = params.reason?.trim() ?? "";

  if (params.decision === LEGAL_HUB_REVIEW_DECISION.REJECT && !reasonTrimmed) {
    return { ok: false, message: "Rejection requires a reason" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const wf = await tx.legalWorkflowSubmission.findUnique({
        where: { id: params.workflowId },
      });

      if (!wf) {
        throw new Error("NOT_FOUND");
      }
      if (wf.status !== LEGAL_HUB_WORKFLOW_STATUS.UNDER_REVIEW) {
        throw new Error("INVALID_STATE");
      }

      const now = new Date();
      const wfNext =
        params.decision === LEGAL_HUB_REVIEW_DECISION.APPROVE
          ? LEGAL_HUB_WORKFLOW_STATUS.APPROVED
          : LEGAL_HUB_WORKFLOW_STATUS.REJECTED;

      await tx.legalWorkflowSubmission.update({
        where: { id: wf.id },
        data: {
          status: wfNext,
          reviewedAt: now,
          reviewedBy: params.reviewerUserId,
        },
      });

      const docNext =
        params.decision === LEGAL_HUB_REVIEW_DECISION.APPROVE
          ? LEGAL_HUB_DOCUMENT_STATUS.APPROVED
          : LEGAL_HUB_DOCUMENT_STATUS.REJECTED;

      await tx.legalHubSubmissionDocument.updateMany({
        where: {
          workflowSubmissionId: wf.id,
          status: LEGAL_HUB_DOCUMENT_STATUS.SUBMITTED,
        },
        data: {
          status: docNext,
          reviewedAt: now,
          reviewedBy: params.reviewerUserId,
          rejectionReason:
            params.decision === LEGAL_HUB_REVIEW_DECISION.REJECT ? reasonTrimmed : null,
        },
      });
    });

    await logLegalAction({
      entityType: LEGAL_HUB_AUDIT_ENTITY.WORKFLOW,
      entityId: params.workflowId,
      action:
        params.decision === LEGAL_HUB_REVIEW_DECISION.APPROVE
          ? LEGAL_HUB_AUDIT_ACTION.APPROVE
          : LEGAL_HUB_AUDIT_ACTION.REJECT,
      actorId: params.reviewerUserId,
      actorType: reviewerActorLabel(params.reviewerRole),
      metadata: {
        decision: params.decision,
        ...(reasonTrimmed ? { reason: reasonTrimmed.slice(0, 2000) } : {}),
      },
    });

    if (eventTimelineFlags.eventTimelineV1) {
      await recordEventSafe(async () =>
        recordEvent(
          mapWorkflowReviewDecisionToEvent({
            workflowId: params.workflowId,
            reviewerUserId: params.reviewerUserId,
            reviewerActorType: reviewerActorLabel(params.reviewerRole),
            decision: params.decision,
            reasonSnippet: reasonTrimmed || null,
          }),
        ),
      );
      await recordEventSafe(async () =>
        recordEvent(
          mapReviewCompletionMarker({
            reviewEntityId: params.workflowId,
            reviewerUserId: params.reviewerUserId,
            reviewerActorType: reviewerActorLabel(params.reviewerRole),
            scope: "workflow",
            decision: params.decision,
          }),
        ),
      );
    }

    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NOT_FOUND") return { ok: false, message: "Workflow not found" };
    if (msg === "INVALID_STATE") return { ok: false, message: "Workflow is not awaiting review" };
    return { ok: false, message: "Review failed" };
  }
}
