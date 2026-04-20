import { eventTimelineFlags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import {
  mapWorkflowDraftCreatedToEvent,
  mapWorkflowSubmittedToEvent,
  recordEventSafe,
} from "@/modules/events/event-helpers";
import { recordEvent } from "@/modules/events/event.service";
import { logLegalAction } from "@/modules/legal/legal-audit.service";
import { getLegalWorkflowDefinition } from "@/modules/legal/legal-workflow-definitions";
import type { LegalHubActorType, LegalWorkflowType } from "@/modules/legal/legal.types";
import {
  LEGAL_HUB_AUDIT_ACTION,
  LEGAL_HUB_AUDIT_ENTITY,
  LEGAL_HUB_DOCUMENT_STATUS,
  LEGAL_HUB_WORKFLOW_STATUS,
} from "@/modules/legal/legal-hub-phase2.constants";

export type SerializedWorkflowSubmission = {
  id: string;
  workflowType: string;
  actorType: string;
  status: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  notes: string | null;
};

function serialize(row: {
  id: string;
  workflowType: string;
  actorType: string;
  status: string;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  notes: string | null;
}): SerializedWorkflowSubmission {
  return {
    id: row.id,
    workflowType: row.workflowType,
    actorType: row.actorType,
    status: row.status,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    notes: row.notes,
  };
}

export async function validateWorkflowBeforeSubmit(params: {
  userId: string;
  actorType: string;
  workflowType: string;
}): Promise<{ ok: true } | { ok: false; message: string; missingRequirementIds?: string[] }> {
  const def = getLegalWorkflowDefinition(params.workflowType as LegalWorkflowType);
  if (!def) {
    return { ok: false, message: "Unknown workflow type" };
  }
  if (!def.actors.includes(params.actorType as LegalHubActorType)) {
    return { ok: false, message: "Actor type is not valid for this workflow" };
  }

  const missing: string[] = [];

  for (const req of def.requirements) {
    const doc = await prisma.legalHubSubmissionDocument.findFirst({
      where: {
        userId: params.userId,
        workflowType: params.workflowType,
        requirementId: req.id,
        status: {
          in: [LEGAL_HUB_DOCUMENT_STATUS.UPLOADED, LEGAL_HUB_DOCUMENT_STATUS.SUBMITTED],
        },
      },
    });
    if (!doc) {
      missing.push(req.id);
    }
  }

  if (missing.length > 0) {
    return {
      ok: false,
      message: "Required documents are missing for one or more checklist items",
      missingRequirementIds: missing,
    };
  }

  return { ok: true };
}

export async function createOrUpdateWorkflowDraft(params: {
  userId: string;
  actorType: string;
  workflowType: string;
  notes?: string | null;
}): Promise<{ ok: true; submission: SerializedWorkflowSubmission } | { ok: false; message: string }> {
  const def = getLegalWorkflowDefinition(params.workflowType as LegalWorkflowType);
  if (!def) {
    return { ok: false, message: "Unknown workflow type" };
  }
  if (!def.actors.includes(params.actorType as LegalHubActorType)) {
    return { ok: false, message: "Actor type is not valid for this workflow" };
  }

  try {
    const existing = await prisma.legalWorkflowSubmission.findUnique({
      where: {
        userId_workflowType: {
          userId: params.userId,
          workflowType: params.workflowType,
        },
      },
    });

    if (
      existing &&
      existing.status !== LEGAL_HUB_WORKFLOW_STATUS.DRAFT &&
      existing.status !== LEGAL_HUB_WORKFLOW_STATUS.REJECTED
    ) {
      return {
        ok: false,
        message: "Workflow cannot be edited while it is in review or already completed",
      };
    }

    const row = await prisma.legalWorkflowSubmission.upsert({
      where: {
        userId_workflowType: {
          userId: params.userId,
          workflowType: params.workflowType,
        },
      },
      create: {
        userId: params.userId,
        actorType: params.actorType,
        workflowType: params.workflowType,
        status: LEGAL_HUB_WORKFLOW_STATUS.DRAFT,
        notes: params.notes?.trim() || null,
      },
      update: {
        actorType: params.actorType,
        status: LEGAL_HUB_WORKFLOW_STATUS.DRAFT,
        notes: params.notes === undefined ? undefined : params.notes?.trim() || null,
      },
    });

    await logLegalAction({
      entityType: LEGAL_HUB_AUDIT_ENTITY.WORKFLOW,
      entityId: row.id,
      action: LEGAL_HUB_AUDIT_ACTION.DRAFT_SAVE,
      actorId: params.userId,
      actorType: params.actorType,
      metadata: {
        workflowType: params.workflowType,
        status: row.status,
      },
    });

    return { ok: true, submission: serialize(row) };
  } catch {
    return { ok: false, message: "Could not save workflow draft" };
  }
}

export async function getWorkflowSubmission(params: {
  userId: string;
  workflowType: string;
}): Promise<{ ok: true; submission: SerializedWorkflowSubmission | null } | { ok: false; message: string }> {
  try {
    const row = await prisma.legalWorkflowSubmission.findUnique({
      where: {
        userId_workflowType: {
          userId: params.userId,
          workflowType: params.workflowType,
        },
      },
    });
    return { ok: true, submission: row ? serialize(row) : null };
  } catch {
    return { ok: false, message: "Could not load workflow" };
  }
}

export async function submitWorkflow(params: {
  userId: string;
  actorType: string;
  workflowType: string;
}): Promise<{ ok: true; submission: SerializedWorkflowSubmission } | { ok: false; message: string }> {
  const def = getLegalWorkflowDefinition(params.workflowType as LegalWorkflowType);
  if (!def) {
    return { ok: false, message: "Unknown workflow type" };
  }
  if (!def.actors.includes(params.actorType as LegalHubActorType)) {
    return { ok: false, message: "Actor type is not valid for this workflow" };
  }

  const gate = await validateWorkflowBeforeSubmit({
    userId: params.userId,
    actorType: params.actorType,
    workflowType: params.workflowType,
  });
  if (!gate.ok) {
    return gate;
  }

  const now = new Date();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.legalWorkflowSubmission.findUnique({
        where: {
          userId_workflowType: {
            userId: params.userId,
            workflowType: params.workflowType,
          },
        },
      });

      if (existing?.status === LEGAL_HUB_WORKFLOW_STATUS.APPROVED) {
        throw new Error("ALREADY_APPROVED");
      }
      if (existing?.status === LEGAL_HUB_WORKFLOW_STATUS.UNDER_REVIEW) {
        throw new Error("ALREADY_SUBMITTED");
      }

      const sub = await tx.legalWorkflowSubmission.upsert({
        where: {
          userId_workflowType: {
            userId: params.userId,
            workflowType: params.workflowType,
          },
        },
        create: {
          userId: params.userId,
          actorType: params.actorType,
          workflowType: params.workflowType,
          status: LEGAL_HUB_WORKFLOW_STATUS.UNDER_REVIEW,
          submittedAt: now,
        },
        update: {
          actorType: params.actorType,
          status: LEGAL_HUB_WORKFLOW_STATUS.UNDER_REVIEW,
          submittedAt: now,
          reviewedAt: null,
          reviewedBy: null,
        },
      });

      await tx.legalHubSubmissionDocument.updateMany({
        where: {
          userId: params.userId,
          workflowType: params.workflowType,
          status: {
            in: [LEGAL_HUB_DOCUMENT_STATUS.UPLOADED, LEGAL_HUB_DOCUMENT_STATUS.SUBMITTED],
          },
          OR: [
            { status: LEGAL_HUB_DOCUMENT_STATUS.UPLOADED },
            { status: LEGAL_HUB_DOCUMENT_STATUS.SUBMITTED, workflowSubmissionId: null },
          ],
        },
        data: {
          workflowSubmissionId: sub.id,
          status: LEGAL_HUB_DOCUMENT_STATUS.SUBMITTED,
          submittedAt: now,
        },
      });

      return sub;
    });

    await logLegalAction({
      entityType: LEGAL_HUB_AUDIT_ENTITY.WORKFLOW,
      entityId: result.id,
      action: LEGAL_HUB_AUDIT_ACTION.WORKFLOW_SUBMIT,
      actorId: params.userId,
      actorType: params.actorType,
      metadata: {
        workflowType: params.workflowType,
        status: result.status,
      },
    });

    if (eventTimelineFlags.eventTimelineV1) {
      await recordEventSafe(async () =>
        recordEvent(
          mapWorkflowSubmittedToEvent({
            workflowSubmissionId: result.id,
            actorId: params.userId,
            actorType: params.actorType,
            workflowType: params.workflowType,
          }),
        ),
      );
    }

    return { ok: true, submission: serialize(result) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "ALREADY_SUBMITTED") {
      return { ok: false, message: "This workflow is already under review" };
    }
    if (msg === "ALREADY_APPROVED") {
      return { ok: false, message: "This workflow has already been approved" };
    }
    return { ok: false, message: "Could not submit workflow" };
  }
}
