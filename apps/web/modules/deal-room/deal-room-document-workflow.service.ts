/**
 * Structured document checklist workflow — explicit statuses, activity audit trail.
 */

import { randomUUID } from "crypto";

import type { PlatformRole } from "@prisma/client";

import { canEditTasksAndDocs, roleIsInternalOperator } from "./deal-room-access";
import type { DealRoomActivityType } from "./deal-room.types";
import type { DealRoomDocumentKind } from "./deal-room.types";
import {
  DOCUMENT_CHECKLIST_TEMPLATES,
  type DocumentChecklistTemplateId,
  templateAllowedForRoom,
} from "./deal-room-document-templates";
import type {
  DealRoomDocumentPacketSummary,
  DealRoomDocumentRequirement,
  DealRoomDocumentWorkflowStatus,
  DealRoomDocumentCategory,
} from "./deal-room-document-workflow.types";
import {
  recordDocumentAttachmentAdded,
  recordDocumentRequirementApproved,
  recordDocumentRequirementCreated,
  recordDocumentRequirementRejected,
  recordMissingRequiredSnapshot,
} from "./deal-room-document-monitoring.service";
import {
  getDocumentById,
  getRoom,
  pushActivity,
  pushDocument,
  pushDocumentRequirement,
  requirementsForRoom,
  updateDocumentRequirementInPlace,
  upsertRoom,
} from "./deal-room.store";

function ts(): string {
  return new Date().toISOString();
}

export function canReviewDocumentRequirements(role: PlatformRole): boolean {
  return role === "ADMIN" || roleIsInternalOperator(role);
}

function bumpRoom(roomId: string): void {
  const room = getRoom(roomId);
  if (!room) return;
  upsertRoom({ ...room, updatedAt: ts() });
}

function wfActivity(args: {
  dealRoomId: string;
  type: DealRoomActivityType;
  actorId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
}): void {
  pushActivity({
    id: `dra_${randomUUID()}`,
    dealRoomId: args.dealRoomId,
    type: args.type,
    actorId: args.actorId,
    summary: args.summary,
    metadata: args.metadata,
    createdAt: ts(),
  });
}

function activityTypeForStatus(status: DealRoomDocumentWorkflowStatus): DealRoomActivityType {
  switch (status) {
    case "requested":
      return "doc_requirement_requested";
    case "received":
      return "doc_requirement_received";
    case "under_review":
      return "doc_requirement_under_review";
    case "approved":
      return "doc_requirement_approved";
    case "rejected":
      return "doc_requirement_rejected";
    default:
      return "doc_requirement_status_changed";
  }
}

export function listDocumentRequirements(roomId: string): DealRoomDocumentRequirement[] {
  return requirementsForRoom(roomId);
}

export function buildDocumentPacketSummary(roomId: string): DealRoomDocumentPacketSummary {
  const reqs = requirementsForRoom(roomId).filter((r) => r.required);
  const totalRequired = reqs.length;
  const approvedCount = reqs.filter((r) => r.status === "approved").length;
  const receivedCount = reqs.filter((r) =>
    ["received", "under_review", "approved"].includes(r.status)
  ).length;
  const missingCount = reqs.filter((r) => r.status !== "approved").length;
  const completionRate = totalRequired === 0 ? 0 : approvedCount / totalRequired;

  try {
    recordMissingRequiredSnapshot(missingCount);
  } catch {
    /* ignore */
  }

  return {
    totalRequired,
    receivedCount,
    approvedCount,
    missingCount,
    completionRate,
  };
}

/** Required rows that are not approved yet (operator chase list). */
export function listMissingRequiredDocuments(roomId: string): DealRoomDocumentRequirement[] {
  return requirementsForRoom(roomId).filter((r) => r.required && r.status !== "approved");
}

export function addDocumentRequirement(args: {
  roomId: string;
  title: string;
  category: DealRoomDocumentCategory;
  required: boolean;
  notes?: string;
  portalShared?: boolean;
  actorId: string;
  actorRole: PlatformRole;
  initialStatus?: DealRoomDocumentWorkflowStatus;
}):
  | { ok: true; requirement: DealRoomDocumentRequirement }
  | { ok: false; error: string } {
  const room = getRoom(args.roomId);
  if (!room) return { ok: false, error: "Room not found." };
  if (!canEditTasksAndDocs({ userId: args.actorId, userRole: args.actorRole, room })) {
    return { ok: false, error: "Cannot add document requirements." };
  }

  const at = ts();
  const req: DealRoomDocumentRequirement = {
    id: `drreq_${randomUUID()}`,
    dealRoomId: args.roomId,
    title: args.title.trim(),
    category: args.category,
    required: args.required,
    status: args.initialStatus ?? "missing",
    notes: args.notes?.trim(),
    portalShared: args.portalShared === true,
    createdAt: at,
    updatedAt: at,
  };
  if (!req.title) return { ok: false, error: "Title required." };

  pushDocumentRequirement(req);
  bumpRoom(args.roomId);

  wfActivity({
    dealRoomId: args.roomId,
    type: "doc_requirement_created",
    actorId: args.actorId,
    summary: `Document checklist: ${req.title} (${req.category}${req.required ? ", required" : ", optional"})`,
    metadata: { requirementId: req.id },
  });

  recordDocumentRequirementCreated();
  return { ok: true, requirement: req };
}

export function updateDocumentRequirementStatus(args: {
  roomId: string;
  requirementId: string;
  status: DealRoomDocumentWorkflowStatus;
  notes?: string;
  actorId: string;
  actorRole: PlatformRole;
}): { ok: true } | { ok: false; error: string } {
  const room = getRoom(args.roomId);
  if (!room) return { ok: false, error: "Room not found." };
  if (!canEditTasksAndDocs({ userId: args.actorId, userRole: args.actorRole, room })) {
    return { ok: false, error: "Cannot update requirements." };
  }

  const cur = requirementsForRoom(args.roomId).find((r) => r.id === args.requirementId);
  if (!cur || cur.dealRoomId !== args.roomId) return { ok: false, error: "Requirement not found." };

  const needsReviewRole = args.status === "approved" || args.status === "rejected";

  if (needsReviewRole && !canReviewDocumentRequirements(args.actorRole)) {
    return { ok: false, error: "Approve/reject is limited to admins and internal operators in V1." };
  }

  const prev = cur.status;
  const next: DealRoomDocumentRequirement = {
    ...cur,
    status: args.status,
    notes: args.notes !== undefined ? args.notes?.trim() : cur.notes,
    updatedAt: ts(),
  };

  updateDocumentRequirementInPlace(next);
  bumpRoom(args.roomId);

  const type =
    prev === args.status ? "doc_requirement_status_changed" : activityTypeForStatus(args.status);
  wfActivity({
    dealRoomId: args.roomId,
    type: prev === args.status ? "doc_requirement_status_changed" : type,
    actorId: args.actorId,
    summary: `Document "${cur.title}": ${prev} → ${args.status}`,
    metadata: { requirementId: cur.id },
  });

  if (args.status === "approved") recordDocumentRequirementApproved();
  if (args.status === "rejected") recordDocumentRequirementRejected();

  return { ok: true };
}

export function attachDocumentToRequirement(args: {
  roomId: string;
  requirementId: string;
  existingDocumentId?: string;
  title?: string;
  kind?: DealRoomDocumentKind;
  url?: string;
  actorId: string;
  actorRole: PlatformRole;
}): { ok: true; documentId: string } | { ok: false; error: string } {
  const room = getRoom(args.roomId);
  if (!room) return { ok: false, error: "Room not found." };
  if (!canEditTasksAndDocs({ userId: args.actorId, userRole: args.actorRole, room })) {
    return { ok: false, error: "Cannot attach documents." };
  }

  const cur = requirementsForRoom(args.roomId).find((r) => r.id === args.requirementId);
  if (!cur || cur.dealRoomId !== args.roomId) return { ok: false, error: "Requirement not found." };

  let docId = args.existingDocumentId?.trim();
  if (docId) {
    const d = getDocumentById(docId);
    if (!d || d.dealRoomId !== args.roomId) return { ok: false, error: "Document not in this room." };
  } else {
    const title = args.title?.trim() || cur.title;
    const kind = args.kind ?? "external_link";
    const url = args.url?.trim();
    if (kind !== "placeholder" && !url) return { ok: false, error: "URL required for link/upload row." };

    docId = `drdoc_${randomUUID()}`;
    pushDocument({
      id: docId,
      dealRoomId: args.roomId,
      title,
      kind,
      url,
      uploadedBy: args.actorId,
      createdAt: ts(),
    });
  }

  const nextStatus: DealRoomDocumentWorkflowStatus =
    cur.status === "approved" ? "approved" : cur.status === "under_review" ? "under_review" : "received";

  updateDocumentRequirementInPlace({
    ...cur,
    attachedDocumentId: docId,
    status: nextStatus,
    updatedAt: ts(),
  });
  bumpRoom(args.roomId);

  wfActivity({
    dealRoomId: args.roomId,
    type: "doc_requirement_attached",
    actorId: args.actorId,
    summary: `Attached document to "${cur.title}" (${docId?.slice(0, 12)}…)`,
    metadata: { requirementId: cur.id, documentId: docId },
  });

  recordDocumentAttachmentAdded();
  if (!docId) return { ok: false, error: "Attachment failed." };
  return { ok: true, documentId: docId };
}

export function applyDocumentChecklistTemplate(args: {
  roomId: string;
  templateId: DocumentChecklistTemplateId;
  actorId: string;
  actorRole: PlatformRole;
}): { ok: true; added: number } | { ok: false; error: string } {
  const room = getRoom(args.roomId);
  if (!room) return { ok: false, error: "Room not found." };
  if (!canEditTasksAndDocs({ userId: args.actorId, userRole: args.actorRole, room })) {
    return { ok: false, error: "Cannot apply template." };
  }

  if (!templateAllowedForRoom(room.entityType, args.templateId)) {
    return { ok: false, error: "Template does not match this room context." };
  }

  const rows = DOCUMENT_CHECKLIST_TEMPLATES[args.templateId];
  let added = 0;
  for (const row of rows) {
    const r = addDocumentRequirement({
      roomId: args.roomId,
      title: row.title,
      category: row.category,
      required: row.required,
      actorId: args.actorId,
      actorRole: args.actorRole,
      initialStatus: "missing",
    });
    if (r.ok) added += 1;
  }

  return { ok: true, added };
}

export function setDocumentRequirementPortalShared(args: {
  roomId: string;
  requirementId: string;
  portalShared: boolean;
  actorId: string;
  actorRole: PlatformRole;
}): { ok: true } | { ok: false; error: string } {
  const room = getRoom(args.roomId);
  if (!room) return { ok: false, error: "Room not found." };
  if (!canEditTasksAndDocs({ userId: args.actorId, userRole: args.actorRole, room })) {
    return { ok: false, error: "Cannot update requirement." };
  }

  const cur = requirementsForRoom(args.roomId).find((r) => r.id === args.requirementId);
  if (!cur || cur.dealRoomId !== args.roomId) return { ok: false, error: "Requirement not found." };

  updateDocumentRequirementInPlace({
    ...cur,
    portalShared: args.portalShared,
    updatedAt: ts(),
  });
  bumpRoom(args.roomId);

  wfActivity({
    dealRoomId: args.roomId,
    type: "doc_requirement_status_changed",
    actorId: args.actorId,
    summary: `Document checklist row ${args.portalShared ? "shared with portal" : "removed from portal"}: ${cur.title}`,
    metadata: { requirementId: args.requirementId },
  });

  return { ok: true };
}
