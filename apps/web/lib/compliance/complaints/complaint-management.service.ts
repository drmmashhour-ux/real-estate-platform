import { prisma } from "@/lib/db";
import { logAuditEvent } from "@/lib/compliance/log-audit-event";
import type { ComplaintAuditActionType } from "@/lib/compliance/complaints/audit-event-types";
import type { ComplaintReferralDestination } from "@/modules/complaints/schemas/escalation-referral.schema";

export type ComplaintAgingState = {
  complaintId: string;
  daysOpen: number;
  firstReceivedAt: Date;
  overdueAcknowledgement: boolean;
  acknowledgeSlaDays: number;
};

function msDays(d: number) {
  return d * 86_400_000;
}

export function getComplaintAgingState(row: {
  id: string;
  firstReceivedAt: Date;
  acknowledgedAt: Date | null;
  status: string;
}, acknowledgeSlaDays = 5): ComplaintAgingState {
  const now = Date.now();
  const start = row.firstReceivedAt.getTime();
  const daysOpen = Math.floor((now - start) / 86_400_000);
  const overdueAcknowledgement =
    row.status === "new" && !row.acknowledgedAt && daysOpen > acknowledgeSlaDays;
  return {
    complaintId: row.id,
    daysOpen,
    firstReceivedAt: row.firstReceivedAt,
    overdueAcknowledgement,
    acknowledgeSlaDays,
  };
}

async function appendComplaintEvent(input: {
  complaintCaseId: string;
  eventType: string;
  performedById: string | null;
  details?: Record<string, unknown>;
  visibleToComplainant?: boolean;
}) {
  await prisma.complaintEvent.create({
    data: {
      complaintCaseId: input.complaintCaseId,
      eventType: input.eventType,
      performedById: input.performedById,
      visibleToComplainant: input.visibleToComplainant ?? false,
      details: input.details ?? undefined,
    },
  });
}

async function auditComplaint(input: {
  ownerType: string;
  ownerId: string;
  complaintId: string;
  actionType: ComplaintAuditActionType;
  actorId: string | null;
  summary: string;
  details?: Record<string, unknown> | null;
  linkedListingId?: string | null;
  linkedDealId?: string | null;
}) {
  await logAuditEvent({
    ownerType: input.ownerType,
    ownerId: input.ownerId,
    entityType: "complaint",
    entityId: input.complaintId,
    actionType: input.actionType,
    moduleKey: "complaints",
    actorId: input.actorId,
    linkedComplaintCaseId: input.complaintId,
    linkedListingId: input.linkedListingId ?? null,
    linkedDealId: input.linkedDealId ?? null,
    summary: input.summary,
    details: input.details ?? null,
    severity: "info",
  });
}

export async function acknowledgeComplaint(input: {
  complaintCaseId: string;
  performedByUserId: string;
}): Promise<void> {
  const c = await prisma.complaintCase.update({
    where: { id: input.complaintCaseId },
    data: { acknowledgedAt: new Date(), status: "acknowledged" },
  });
  await appendComplaintEvent({
    complaintCaseId: c.id,
    eventType: "complaint_acknowledged",
    performedById: input.performedByUserId,
    details: { at: new Date().toISOString() },
  });
  await auditComplaint({
    ownerType: c.ownerType,
    ownerId: c.ownerId,
    complaintId: c.id,
    actionType: "complaint_acknowledged",
    actorId: input.performedByUserId,
    summary: "Complaint acknowledged",
    linkedListingId: c.linkedListingId,
    linkedDealId: c.linkedDealId,
  });
}

export async function assignComplaintOwner(input: {
  complaintCaseId: string;
  ownerUserId: string;
  performedByUserId: string;
}): Promise<void> {
  const c = await prisma.complaintCase.update({
    where: { id: input.complaintCaseId },
    data: { assignedOwnerUserId: input.ownerUserId },
  });
  await appendComplaintEvent({
    complaintCaseId: c.id,
    eventType: "complaint_assigned",
    performedById: input.performedByUserId,
    details: { assignedOwnerUserId: input.ownerUserId },
  });
  await auditComplaint({
    ownerType: c.ownerType,
    ownerId: c.ownerId,
    complaintId: c.id,
    actionType: "complaint_assigned",
    actorId: input.performedByUserId,
    summary: "Complaint owner assigned",
    details: { assignedOwnerUserId: input.ownerUserId },
    linkedListingId: c.linkedListingId,
    linkedDealId: c.linkedDealId,
  });
}

export async function updateComplaintStatus(input: {
  complaintCaseId: string;
  status: string;
  performedByUserId: string;
}): Promise<void> {
  const c = await prisma.complaintCase.update({
    where: { id: input.complaintCaseId },
    data: { status: input.status },
  });
  await appendComplaintEvent({
    complaintCaseId: c.id,
    eventType: "status_changed",
    performedById: input.performedByUserId,
    details: { status: input.status },
  });
}

export async function attachComplaintEvidence(input: {
  complaintCaseId: string;
  documentId: string;
  fileName: string;
  fileUrl: string;
  uploadedById: string | null;
}): Promise<void> {
  const c = await prisma.complaintCase.findUnique({
    where: { id: input.complaintCaseId },
    select: {
      id: true,
      ownerType: true,
      ownerId: true,
      evidenceDocumentIds: true,
      linkedListingId: true,
      linkedDealId: true,
    },
  });
  if (!c) throw new Error("COMPLAINT_NOT_FOUND");

  const prev = Array.isArray(c.evidenceDocumentIds)
    ? (c.evidenceDocumentIds as string[])
    : [];
  const next = [...new Set([...prev, input.documentId])];

  await prisma.complaintAttachment.create({
    data: {
      complaintCaseId: input.complaintCaseId,
      fileName: input.fileName,
      fileUrl: input.fileUrl,
      uploadedById: input.uploadedById,
    },
  });

  await prisma.complaintCase.update({
    where: { id: input.complaintCaseId },
    data: { evidenceDocumentIds: next },
  });

  await appendComplaintEvent({
    complaintCaseId: input.complaintCaseId,
    eventType: "evidence_attached",
    performedById: input.uploadedById,
    details: { documentId: input.documentId, fileName: input.fileName },
  });

  await auditComplaint({
    ownerType: c.ownerType,
    ownerId: c.ownerId,
    complaintId: c.id,
    actionType: "complaint_evidence_attached",
    actorId: input.uploadedById,
    summary: "Complaint evidence attached",
    details: { documentId: input.documentId },
    linkedListingId: c.linkedListingId,
    linkedDealId: c.linkedDealId,
  });
}

export async function recordComplaintClassification(input: {
  complaintCaseId: string;
  reviewerId: string;
  initialClassification: string;
  severity: string;
  plausibleComplianceCategories: string[];
  requiresManualReview: boolean;
  requiresConsumerProtectionExplanation: boolean;
  suggestPublicAssistanceReferral: boolean;
  suggestSyndicReferral: boolean;
}): Promise<void> {
  const c = await prisma.complaintCase.findUnique({
    where: { id: input.complaintCaseId },
    select: {
      id: true,
      ownerType: true,
      ownerId: true,
      linkedListingId: true,
      linkedDealId: true,
    },
  });
  if (!c) throw new Error("COMPLAINT_NOT_FOUND");

  await prisma.complaintClassificationReview.create({
    data: {
      complaintCaseId: c.id,
      initialClassification: input.initialClassification,
      severity: input.severity,
      plausibleComplianceCategories: input.plausibleComplianceCategories,
      requiresManualReview: input.requiresManualReview,
      requiresConsumerProtectionExplanation: input.requiresConsumerProtectionExplanation,
      suggestPublicAssistanceReferral: input.suggestPublicAssistanceReferral,
      suggestSyndicReferral: input.suggestSyndicReferral,
      reviewerId: input.reviewerId,
    },
  });

  await prisma.complaintCase.update({
    where: { id: c.id },
    data: { severity: input.severity },
  });

  await appendComplaintEvent({
    complaintCaseId: c.id,
    eventType: "complaint_classified",
    performedById: input.reviewerId,
    details: {
      initialClassification: input.initialClassification,
      severity: input.severity,
    },
  });

  await auditComplaint({
    ownerType: c.ownerType,
    ownerId: c.ownerId,
    complaintId: c.id,
    actionType: "complaint_classified",
    actorId: input.reviewerId,
    summary: "Complaint classified",
    details: {
      initialClassification: input.initialClassification,
      plausibleComplianceCategories: input.plausibleComplianceCategories,
    },
    linkedListingId: c.linkedListingId,
    linkedDealId: c.linkedDealId,
  });

  const suggestions: { destination: ComplaintReferralDestination; reason: string }[] = [];
  if (input.suggestPublicAssistanceReferral) {
    suggestions.push({
      destination: "public_assistance",
      reason: "Classification suggests neutral public guidance may help the consumer.",
    });
    await auditComplaint({
      ownerType: c.ownerType,
      ownerId: c.ownerId,
      complaintId: c.id,
      actionType: "complaint_public_assistance_suggested",
      actorId: input.reviewerId,
      summary: "Public assistance referral suggested (logged only)",
      linkedListingId: c.linkedListingId,
      linkedDealId: c.linkedDealId,
    });
  }
  if (input.suggestSyndicReferral) {
    suggestions.push({
      destination: "syndic",
      reason: "Plausible ethical, trust-account, or serious conduct issues — Syndic path may apply.",
    });
    await auditComplaint({
      ownerType: c.ownerType,
      ownerId: c.ownerId,
      complaintId: c.id,
      actionType: "complaint_syndic_suggested",
      actorId: input.reviewerId,
      summary: "Syndic referral suggested (logged only)",
      linkedListingId: c.linkedListingId,
      linkedDealId: c.linkedDealId,
    });
  }
  suggestions.push({
    destination: "info_oaciq",
    reason: "Regulatory information and professional standards are published by OACIQ.",
  });
  await auditComplaint({
    ownerType: c.ownerType,
    ownerId: c.ownerId,
    complaintId: c.id,
    actionType: "complaint_escalation_suggested",
    actorId: input.reviewerId,
    summary: "Structured escalation destinations recorded",
    details: { destinations: suggestions.map((s) => s.destination) },
    linkedListingId: c.linkedListingId,
    linkedDealId: c.linkedDealId,
  });

  for (const s of suggestions) {
    await prisma.complaintEscalationSuggestion.create({
      data: {
        complaintCaseId: c.id,
        destination: s.destination,
        reason: s.reason,
        recommended: true,
        createdByUserId: input.reviewerId,
      },
    });
  }
}

export async function markComplaintResolved(input: {
  complaintCaseId: string;
  resolutionNote: string;
  performedByUserId: string;
}): Promise<void> {
  const note = input.resolutionNote.trim();
  if (!note) throw new Error("RESOLUTION_NOTE_REQUIRED");

  const c = await prisma.complaintCase.update({
    where: { id: input.complaintCaseId },
    data: {
      status: "resolved_internal",
      resolutionNote: note,
      closedAt: new Date(),
    },
  });

  await appendComplaintEvent({
    complaintCaseId: c.id,
    eventType: "complaint_resolved",
    performedById: input.performedByUserId,
    details: { resolutionNote: note },
  });

  await auditComplaint({
    ownerType: c.ownerType,
    ownerId: c.ownerId,
    complaintId: c.id,
    actionType: "complaint_resolved",
    actorId: input.performedByUserId,
    summary: "Complaint resolved",
    details: { resolutionNote: note },
    linkedListingId: c.linkedListingId,
    linkedDealId: c.linkedDealId,
  });
}

/** @internal — use `msDays` in tests / policies */
export { msDays };
