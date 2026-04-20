import { mkdir, unlink, writeFile } from "fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { scanBufferBeforeStorage } from "@/lib/security/malware-scan";
import { uploadFile } from "@/lib/storage/upload-file";
import { SUPABASE_STORAGE_BUCKETS } from "@/lib/supabase/buckets";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { logLegalAction } from "@/modules/legal/legal-audit.service";
import type { LegalHubActorType, LegalWorkflowType } from "@/modules/legal/legal.types";
import { getLegalWorkflowDefinition } from "@/modules/legal/legal-workflow-definitions";
import {
  LEGAL_HUB_AUDIT_ACTION,
  LEGAL_HUB_AUDIT_ENTITY,
  LEGAL_HUB_DOCUMENT_STATUS,
} from "@/modules/legal/legal-hub-phase2.constants";
import {
  extensionForLegalMime,
  sanitizeLegalHubDisplayName,
  validateLegalHubBuffer,
} from "@/modules/legal/legal-hub-mime-sniff";
import {
  mapLegalDocumentSubmitToEvent,
  mapLegalDocumentUploadToEvent,
  recordEventSafe,
} from "@/modules/events/event-helpers";
import { recordEvent } from "@/modules/events/event.service";

export type SerializedLegalHubDocument = {
  id: string;
  workflowType: string;
  requirementId: string;
  actorType: string;
  /** Storage key only — use signed URLs from a controlled download path later if needed. */
  fileUrl: string;
  fileName: string;
  fileType: string;
  status: string;
  uploadedAt: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
};

function serializeLegalHubDocument(row: {
  id: string;
  workflowType: string;
  requirementId: string;
  actorType: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  status: string;
  uploadedAt: Date;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
}): SerializedLegalHubDocument {
  return {
    id: row.id,
    workflowType: row.workflowType,
    requirementId: row.requirementId,
    actorType: row.actorType,
    fileUrl: row.fileUrl,
    fileName: row.fileName,
    fileType: row.fileType,
    status: row.status,
    uploadedAt: row.uploadedAt.toISOString(),
    submittedAt: row.submittedAt?.toISOString() ?? null,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    rejectionReason: row.rejectionReason,
  };
}

function validateActorWorkflowRequirement(
  actorType: string,
  workflowType: string,
  requirementId: string,
): { ok: true } | { ok: false; message: string } {
  const def = getLegalWorkflowDefinition(workflowType as LegalWorkflowType);
  if (!def) {
    return { ok: false, message: "Unknown workflow type" };
  }
  if (!def.actors.includes(actorType as LegalHubActorType)) {
    return { ok: false, message: "Actor type is not valid for this workflow" };
  }
  const hasReq = def.requirements.some((r) => r.id === requirementId);
  if (!hasReq) {
    return { ok: false, message: "Unknown requirement for this workflow" };
  }
  return { ok: true };
}

async function deleteLegalHubFileFromStorage(storagePath: string): Promise<void> {
  if (storagePath.startsWith("local:")) {
    const rel = storagePath.slice("local:".length);
    const diskPath = path.join(process.cwd(), "private", "uploads", rel);
    try {
      await unlink(diskPath);
    } catch {
      /* optional */
    }
    return;
  }

  if (!isSupabaseAdminConfigured()) return;
  try {
    const admin = getSupabaseAdmin();
    await admin.storage.from(SUPABASE_STORAGE_BUCKETS.documents).remove([storagePath]);
  } catch {
    /* optional */
  }
}

export async function uploadLegalDocument(params: {
  userId: string;
  actorType: string;
  workflowType: string;
  requirementId: string;
  buffer: Buffer;
  declaredMime?: string | null;
  originalFileName?: string | null;
}): Promise<{ ok: true; document: SerializedLegalHubDocument } | { ok: false; message: string }> {
  const v = validateActorWorkflowRequirement(params.actorType, params.workflowType, params.requirementId);
  if (!v.ok) return v;

  const bufCheck = validateLegalHubBuffer({
    buffer: params.buffer,
    declaredMime: params.declaredMime,
  });
  if (!bufCheck.ok) return bufCheck;

  const scan = await scanBufferBeforeStorage({
    bytes: params.buffer,
    mimeType: bufCheck.mime,
    context: "legal_hub_submission_document",
  });
  if (!scan.ok) {
    return { ok: false, message: scan.userMessage };
  }

  const ext = extensionForLegalMime(bufCheck.mime);
  if (!ext) {
    return { ok: false, message: "Unsupported file type" };
  }

  const storedName = `${randomUUID()}.${ext}`;
  const basePath = `${params.userId}/${params.workflowType}/${storedName}`;
  let storageKey = basePath;

  try {
    if (isSupabaseAdminConfigured()) {
      await uploadFile(SUPABASE_STORAGE_BUCKETS.documents, basePath, params.buffer, {
        contentType: bufCheck.mime,
        upsert: false,
      });
    } else {
      const relative = path.join("legal-hub", params.userId, params.workflowType, storedName);
      const dir = path.join(process.cwd(), "private", "uploads", "legal-hub", params.userId, params.workflowType);
      await mkdir(dir, { recursive: true });
      const diskPath = path.join(dir, storedName);
      await writeFile(diskPath, params.buffer);
      storageKey = `local:${relative}`;
    }
  } catch {
    return { ok: false, message: "Storage upload failed" };
  }

  const displayName = sanitizeLegalHubDisplayName(
    params.originalFileName?.trim() || `document.${ext}`,
  );

  let row;
  try {
    row = await prisma.legalHubSubmissionDocument.create({
      data: {
        userId: params.userId,
        actorType: params.actorType,
        workflowType: params.workflowType,
        requirementId: params.requirementId,
        fileUrl: storageKey,
        fileName: displayName,
        fileType: bufCheck.mime,
        status: LEGAL_HUB_DOCUMENT_STATUS.UPLOADED,
      },
    });
  } catch {
    await deleteLegalHubFileFromStorage(storageKey);
    return { ok: false, message: "Could not save document metadata" };
  }

  await logLegalAction({
    entityType: LEGAL_HUB_AUDIT_ENTITY.DOCUMENT,
    entityId: row.id,
    action: LEGAL_HUB_AUDIT_ACTION.UPLOAD,
    actorId: params.userId,
    actorType: params.actorType,
    metadata: {
      workflowType: params.workflowType,
      requirementId: params.requirementId,
      status: row.status,
      fileType: bufCheck.mime,
    },
  });

  if (eventTimelineFlags.eventTimelineV1) {
    await recordEventSafe(async () =>
      recordEvent(
        mapLegalDocumentUploadToEvent({
          documentId: row.id,
          actorId: params.userId,
          actorType: params.actorType,
          workflowType: params.workflowType,
          requirementId: params.requirementId,
        }),
      ),
    );
  }

  return { ok: true, document: serializeLegalHubDocument(row) };
}

export async function getLegalDocumentsByUser(params: {
  userId: string;
  workflowType?: string | null;
}): Promise<SerializedLegalHubDocument[]> {
  try {
    const rows = await prisma.legalHubSubmissionDocument.findMany({
      where: {
        userId: params.userId,
        ...(params.workflowType ? { workflowType: params.workflowType } : {}),
      },
      orderBy: { uploadedAt: "desc" },
    });
    return rows.map(serializeLegalHubDocument);
  } catch {
    return [];
  }
}

export async function getLegalDocumentsByWorkflow(params: {
  userId: string;
  workflowType: string;
}): Promise<SerializedLegalHubDocument[]> {
  return getLegalDocumentsByUser({ userId: params.userId, workflowType: params.workflowType });
}

export async function submitLegalDocument(params: {
  userId: string;
  documentId: string;
}): Promise<{ ok: true; document: SerializedLegalHubDocument } | { ok: false; message: string }> {
  const row = await prisma.legalHubSubmissionDocument.findFirst({
    where: { id: params.documentId, userId: params.userId },
  });

  if (!row) {
    return { ok: false, message: "Document not found" };
  }
  if (row.status !== LEGAL_HUB_DOCUMENT_STATUS.UPLOADED) {
    return { ok: false, message: "Only uploaded documents can be submitted for review" };
  }

  const now = new Date();
  let updated;
  try {
    updated = await prisma.legalHubSubmissionDocument.update({
      where: { id: row.id },
      data: {
        status: LEGAL_HUB_DOCUMENT_STATUS.SUBMITTED,
        submittedAt: now,
      },
    });
  } catch {
    return { ok: false, message: "Could not submit document" };
  }

  await logLegalAction({
    entityType: LEGAL_HUB_AUDIT_ENTITY.DOCUMENT,
    entityId: updated.id,
    action: LEGAL_HUB_AUDIT_ACTION.SUBMIT,
    actorId: params.userId,
    actorType: updated.actorType,
    metadata: {
      workflowType: updated.workflowType,
      requirementId: updated.requirementId,
      status: updated.status,
    },
  });

  if (eventTimelineFlags.eventTimelineV1) {
    await recordEventSafe(async () =>
      recordEvent(
        mapLegalDocumentSubmitToEvent({
          documentId: updated.id,
          actorId: params.userId,
          actorType: updated.actorType,
          workflowType: updated.workflowType,
          requirementId: updated.requirementId,
        }),
      ),
    );
  }

  return { ok: true, document: serializeLegalHubDocument(updated) };
}

export async function deleteLegalDocument(params: {
  userId: string;
  documentId: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  let row;
  try {
    row = await prisma.legalHubSubmissionDocument.findFirst({
      where: { id: params.documentId, userId: params.userId },
    });
  } catch {
    return { ok: false, message: "Document not found" };
  }

  if (!row) {
    return { ok: false, message: "Document not found" };
  }
  if (row.status !== LEGAL_HUB_DOCUMENT_STATUS.UPLOADED) {
    return { ok: false, message: "Only drafts (uploaded, not submitted) can be deleted" };
  }

  await deleteLegalHubFileFromStorage(row.fileUrl);

  try {
    await prisma.legalHubSubmissionDocument.delete({ where: { id: row.id } });
  } catch {
    return { ok: false, message: "Could not delete document" };
  }

  await logLegalAction({
    entityType: LEGAL_HUB_AUDIT_ENTITY.DOCUMENT,
    entityId: params.documentId,
    action: LEGAL_HUB_AUDIT_ACTION.DELETE,
    actorId: params.userId,
    actorType: row.actorType,
    metadata: {
      workflowType: row.workflowType,
      requirementId: row.requirementId,
    },
  });

  return { ok: true };
}
