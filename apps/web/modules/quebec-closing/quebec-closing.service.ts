import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { appendClosingAudit } from "@/modules/closing/closing-audit";
import { confirmClosingExecution } from "@/modules/closing/closing-room.service";
import { evaluateFinalClosingReadiness } from "@/modules/closing/closing-orchestrator";
import { upsertCondition } from "@/modules/deal-execution/condition-tracker.service";
import { buildClosingPacketIndex } from "@/modules/quebec-closing/quebec-closing-packet";
import {
  deedAndRegistrationBlockers,
  deriveInitialQcStage,
  isConditionResolved,
  notaryAssignmentComplete,
  notaryChecklistTerminal,
  qcExecutionBlockers,
  signingScheduledBlockers,
  isQcWorkflowActive,
} from "@/modules/quebec-closing/quebec-closing-gates";
import type { QcClosingStage } from "@/modules/quebec-closing/quebec-closing.types";
import {
  QC_NOTARY_CHECKLIST_KEYS,
  normalizeQcClosingStage,
  type DealClosingAdjustmentKind,
} from "@/modules/quebec-closing/quebec-closing.types";
import { summarizeClosingFundFlow } from "@/modules/quebec-closing/quebec-closing-fund-flow";

export async function ensureQuebecClosingSessionDefaults(dealId: string): Promise<void> {
  const [deal, closing, conds] = await Promise.all([
    prisma.deal.findUnique({ where: { id: dealId }, select: { status: true } }),
    prisma.dealClosing.findUnique({ where: { dealId } }),
    prisma.dealClosingCondition.findMany({ where: { dealId } }),
  ]);
  if (!deal || !closing || closing.status === "CLOSED") return;
  if (closing.qcClosingStage && closing.qcWorkflowStartedAt) return;

  const stage = deriveInitialQcStage(deal.status, conds);
  await prisma.dealClosing.update({
    where: { dealId },
    data: {
      qcWorkflowStartedAt: closing.qcWorkflowStartedAt ?? new Date(),
      qcClosingStage: closing.qcClosingStage ?? stage,
      offerAcceptedAt:
        closing.offerAcceptedAt ??
        (["accepted", "inspection", "financing", "closing_scheduled", "closed"].includes(deal.status) ?
          new Date()
        : null),
      updatedAt: new Date(),
    },
  });
}

async function ensureNotaryChecklistRows(dealId: string): Promise<void> {
  await prisma.$transaction(
    QC_NOTARY_CHECKLIST_KEYS.map((itemKey) =>
      prisma.dealQuebecNotaryChecklistItem.upsert({
        where: { dealId_itemKey: { dealId, itemKey } },
        create: { dealId, itemKey, status: "PENDING" },
        update: {},
      }),
    ),
  );
}

/** Migrate legacy `qcClosingStage` strings in DB to current canonical stages. */
async function persistNormalizedQcStage(dealId: string): Promise<void> {
  const row = await prisma.dealClosing.findUnique({
    where: { dealId },
    select: { qcClosingStage: true },
  });
  if (!row?.qcClosingStage) return;
  const n = normalizeQcClosingStage(row.qcClosingStage);
  if (n && n !== row.qcClosingStage) {
    await prisma.dealClosing.update({
      where: { dealId },
      data: { qcClosingStage: n, updatedAt: new Date() },
    });
  }
}

async function appendCoordinationAudit(dealId: string, actorUserId: string, action: string, payload: Record<string, unknown>) {
  await prisma.dealCoordinationAuditLog.create({
    data: {
      dealId,
      actorUserId,
      action,
      entityType: "QUEBEC_CLOSING",
      payload,
    },
  });
}

export async function getQuebecClosingBundle(dealId: string) {
  await ensureQuebecClosingSessionDefaults(dealId);
  await ensureNotaryChecklistRows(dealId);
  await persistNormalizedQcStage(dealId);

  const [closing, conditions, notary, checklist, adjustments, audits, closingAudits, readiness, packet, payments] =
    await Promise.all([
      prisma.dealClosing.findUnique({ where: { dealId } }),
      prisma.dealClosingCondition.findMany({ where: { dealId }, orderBy: { deadline: "asc" } }),
      prisma.dealNotaryCoordination.findUnique({ where: { dealId } }),
      prisma.dealQuebecNotaryChecklistItem.findMany({ where: { dealId }, orderBy: { itemKey: "asc" } }),
      prisma.dealClosingAdjustment.findMany({ where: { dealId }, orderBy: { createdAt: "asc" } }),
      prisma.dealCoordinationAuditLog.findMany({
        where: { dealId, entityType: "QUEBEC_CLOSING" },
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.dealClosingAudit.findMany({
        where: { dealId },
        orderBy: { createdAt: "desc" },
        take: 40,
      }),
      evaluateFinalClosingReadiness(dealId),
      buildClosingPacketIndex(dealId),
      prisma.lecipmDealPayment.findMany({ where: { dealId }, orderBy: { createdAt: "asc" } }),
    ]);

  const qcBlockers =
    closing ?
      qcExecutionBlockers({
        closing,
        conditions,
        notary,
        notaryChecklist: checklist,
      })
    : [];

  const signingBlockers =
    closing ?
      signingScheduledBlockers({
        closing,
        conditions,
        notary,
        notaryChecklist: checklist,
        baseReadinessReady: readiness.readinessStatus === "READY",
        currentStage: (closing.qcClosingStage as QcClosingStage | null) ?? null,
      })
    : ["No closing session"];

  const deedBlockers =
    closing && notary ? deedAndRegistrationBlockers({ closing, notary }) : [];

  return {
    closing,
    conditions,
    notary,
    notaryChecklist: checklist,
    adjustments,
    readiness,
    qcBlockers,
    signingReadinessBlockers: signingBlockers,
    deedCompletionBlockers: deedBlockers,
    coordinationAudits: audits,
    closingAudits: closingAudits,
    closingPacket: packet,
    fundFlow: summarizeClosingFundFlow(payments),
    flags: {
      qcWorkflowActive: isQcWorkflowActive(closing),
      notaryOk: notaryAssignmentComplete(notary),
      checklistTerminal: notaryChecklistTerminal(checklist),
      packetMarkedComplete: Boolean(closing?.closingPacketMarkedCompleteAt),
    },
  };
}

export async function applyQuebecNotaryUpdate(options: {
  dealId: string;
  actorUserId: string;
  notaryId?: string | null;
  notaryDisplayName?: string | null;
  notaryOffice?: string | null;
  notaryEmail?: string | null;
  notaryPhone?: string | null;
  appointmentAt?: string | null;
  requestedDocuments?: unknown[] | null;
  deedReadinessNotes?: string | null;
  /** IN_PERSON | REMOTE_DIGITAL | HYBRID */
  signingChannel?: string | null;
  checklist?: Partial<Record<(typeof QC_NOTARY_CHECKLIST_KEYS)[number], { status: string; notes?: string | null }>>;
  markPacketComplete?: boolean;
}) {
  await ensureQuebecClosingSessionDefaults(options.dealId);
  await ensureNotaryChecklistRows(options.dealId);

  const appointmentAt =
    typeof options.appointmentAt === "string" && options.appointmentAt.trim() ?
      new Date(options.appointmentAt)
    : null;

  const row = await prisma.dealNotaryCoordination.upsert({
    where: { dealId: options.dealId },
    create: {
      dealId: options.dealId,
      notaryId: options.notaryId ?? null,
      notaryDisplayName: options.notaryDisplayName ?? null,
      notaryOffice: options.notaryOffice ?? null,
      notaryEmail: options.notaryEmail ?? null,
      notaryPhone: options.notaryPhone ?? null,
      appointmentAt,
      requestedDocumentsJson: options.requestedDocuments ?? [],
      deedReadinessNotes: options.deedReadinessNotes ?? null,
      signingChannel: options.signingChannel?.trim() || null,
      selectedAt: options.notaryId || options.notaryDisplayName ? new Date() : null,
    },
    update: {
      notaryId: options.notaryId === undefined ? undefined : options.notaryId,
      notaryDisplayName: options.notaryDisplayName === undefined ? undefined : options.notaryDisplayName,
      notaryOffice: options.notaryOffice === undefined ? undefined : options.notaryOffice,
      notaryEmail: options.notaryEmail === undefined ? undefined : options.notaryEmail,
      notaryPhone: options.notaryPhone === undefined ? undefined : options.notaryPhone,
      appointmentAt: appointmentAt === null && options.appointmentAt === null ? undefined : appointmentAt,
      requestedDocumentsJson: options.requestedDocuments ?? undefined,
      deedReadinessNotes: options.deedReadinessNotes === undefined ? undefined : options.deedReadinessNotes,
      signingChannel:
        options.signingChannel === undefined ? undefined : options.signingChannel?.trim() || null,
      selectedAt: options.notaryId || options.notaryDisplayName ? new Date() : undefined,
      updatedAt: new Date(),
    },
  });

  if (options.checklist) {
    for (const key of QC_NOTARY_CHECKLIST_KEYS) {
      const patch = options.checklist[key];
      if (!patch) continue;
      const receivedAt = patch.status === "RECEIVED" ? new Date() : null;
      await prisma.dealQuebecNotaryChecklistItem.updateMany({
        where: { dealId: options.dealId, itemKey: key },
        data: {
          status: patch.status,
          notes: patch.notes ?? null,
          receivedAt,
          updatedAt: new Date(),
        },
      });
    }
  }

  const checklistRows = await prisma.dealQuebecNotaryChecklistItem.findMany({ where: { dealId: options.dealId } });
  const closing = await prisma.dealClosing.findUnique({ where: { dealId: options.dealId } });
  let nextStage = normalizeQcClosingStage(closing?.qcClosingStage) ?? null;
  const preserveStages: QcClosingStage[] = ["SIGNING_READY", "SIGNED", "CLOSED"];
  if (notaryAssignmentComplete(row) && (!nextStage || !preserveStages.includes(nextStage))) {
    const hasPending = checklistRows.some((r) => r.status === "PENDING");
    if (!nextStage || ["OFFER_ACCEPTED", "CONDITIONS_PENDING", "CONDITIONS_MET"].includes(nextStage)) {
      nextStage = "NOTARY_ASSIGNED";
    }
    if (hasPending) {
      nextStage = "DOCUMENT_PREP";
    }
  }

  await prisma.dealClosing.update({
    where: { dealId: options.dealId },
    data: {
      qcClosingStage: nextStage ?? closing?.qcClosingStage,
      closingPacketMarkedCompleteAt:
        options.markPacketComplete ? new Date() : closing?.closingPacketMarkedCompleteAt,
      closingPacketCompleteByUserId: options.markPacketComplete ? options.actorUserId : closing?.closingPacketCompleteByUserId,
      updatedAt: new Date(),
    },
  });

  await appendCoordinationAudit(options.dealId, options.actorUserId, "QC_NOTARY_UPDATE", {
    notaryId: row.notaryId,
    stage: nextStage,
  });
  await appendClosingAudit({
    dealId: options.dealId,
    actorUserId: options.actorUserId,
    eventType: "QC_NOTARY_UPDATE",
    note: "Québec notary coordination updated",
    metadataJson: { stage: nextStage },
  });

  return getQuebecClosingBundle(options.dealId);
}

export async function applyQuebecConditionsUpdate(options: {
  dealId: string;
  actorUserId: string;
  items: Array<{
    id?: string;
    conditionType: string;
    deadline: string;
    status?: string;
    notes?: string | null;
    relatedForm?: string | null;
  }>;
}) {
  await ensureQuebecClosingSessionDefaults(options.dealId);
  const closing = await prisma.dealClosing.findUnique({ where: { dealId: options.dealId } });
  if (!closing) throw new Error("Closing session not found.");

  for (const item of options.items) {
    if (!item.deadline?.trim()) {
      throw new Error(`Deadline required for condition “${item.conditionType}”.`);
    }
    const deadline = new Date(item.deadline);
    if (Number.isNaN(deadline.getTime())) {
      throw new Error(`Invalid deadline for condition “${item.conditionType}”.`);
    }
    await upsertCondition({
      dealId: options.dealId,
      id: item.id,
      conditionType: item.conditionType,
      deadline,
      status: item.status ?? "pending",
      notes: item.notes ?? null,
      relatedForm: item.relatedForm ?? null,
    });
  }

  const conditions = await prisma.dealClosingCondition.findMany({ where: { dealId: options.dealId } });
  const anyFailed = conditions.some((c) => c.status === "failed");
  let nextStage = closing.qcClosingStage as QcClosingStage | undefined;
  if (!anyFailed && conditions.every(isConditionResolved)) {
    nextStage = "CONDITIONS_MET";
  } else if (conditions.some((c) => !isConditionResolved(c) && c.status !== "failed")) {
    nextStage = "CONDITIONS_PENDING";
  }

  await prisma.dealClosing.update({
    where: { dealId: options.dealId },
    data: {
      qcClosingStage: nextStage ?? closing.qcClosingStage,
      updatedAt: new Date(),
    },
  });

  await appendCoordinationAudit(options.dealId, options.actorUserId, "QC_CONDITIONS_UPDATE", {
    count: options.items.length,
  });
  await appendClosingAudit({
    dealId: options.dealId,
    actorUserId: options.actorUserId,
    eventType: "QC_CONDITIONS_UPDATE",
    note: "Québec closing conditions updated",
    metadataJson: { types: options.items.map((i) => i.conditionType) },
  });

  return getQuebecClosingBundle(options.dealId);
}

export async function markQuebecSigningReady(options: { dealId: string; actorUserId: string; signingAt?: string | null }) {
  await ensureQuebecClosingSessionDefaults(options.dealId);
  const bundle = await getQuebecClosingBundle(options.dealId);
  if (bundle.signingReadinessBlockers.length > 0) {
    throw new Error(bundle.signingReadinessBlockers.join(" "));
  }

  const signingScheduledAt =
    typeof options.signingAt === "string" && options.signingAt.trim() ?
      new Date(options.signingAt)
    : null;

  await prisma.dealClosing.update({
    where: { dealId: options.dealId },
    data: {
      qcClosingStage: "SIGNING_READY",
      signingScheduledAt: signingScheduledAt ?? new Date(),
      updatedAt: new Date(),
    },
  });

  await appendCoordinationAudit(options.dealId, options.actorUserId, "QC_SIGNING_READY", {});
  await appendClosingAudit({
    dealId: options.dealId,
    actorUserId: options.actorUserId,
    eventType: "QC_SIGNING_READY",
    note: "Signing ready — notary signing (Québec)",
    metadataJson: { signingScheduledAt: (signingScheduledAt ?? new Date()).toISOString() },
  });

  return getQuebecClosingBundle(options.dealId);
}

export async function completeQuebecClosing(options: {
  dealId: string;
  actorUserId: string;
  deedSignedAt: string;
  deedActNumber?: string | null;
  deedPublicationReference?: string | null;
  landRegisterStatus: "PENDING" | "CONFIRMED" | "NOT_APPLICABLE";
  landRegisterConfirmedAt?: string | null;
  releaseKeys?: boolean;
  closingDate?: string | null;
  notes?: string | null;
}) {
  await ensureQuebecClosingSessionDefaults(options.dealId);
  const deedSignedAt = new Date(options.deedSignedAt);
  if (Number.isNaN(deedSignedAt.getTime())) throw new Error("Invalid deedSignedAt");

  const notary = await prisma.dealNotaryCoordination.findUnique({ where: { dealId: options.dealId } });
  const closingBefore = await prisma.dealClosing.findUnique({ where: { dealId: options.dealId } });
  if (!closingBefore) throw new Error("Closing session not found.");

  if (options.landRegisterStatus === "PENDING") {
    await prisma.dealClosing.update({
      where: { dealId: options.dealId },
      data: {
        deedSignedAt,
        deedActNumber: options.deedActNumber ?? null,
        deedPublicationReference: options.deedPublicationReference ?? null,
        landRegisterStatus: "PENDING",
        qcClosingStage: "SIGNED",
        updatedAt: new Date(),
      },
    });
    await appendClosingAudit({
      dealId: options.dealId,
      actorUserId: options.actorUserId,
      eventType: "QC_NOTARY_SIGNED",
      note: "Notarial signing recorded — land register pending",
      metadataJson: { landRegisterStatus: "PENDING" },
    });
    await appendCoordinationAudit(options.dealId, options.actorUserId, "QC_NOTARY_SIGNED", { landRegisterStatus: "PENDING" });
    return getQuebecClosingBundle(options.dealId);
  }

  const landRegisterConfirmedAt =
    options.landRegisterStatus === "CONFIRMED" && options.landRegisterConfirmedAt ?
      new Date(options.landRegisterConfirmedAt)
    : options.landRegisterStatus === "CONFIRMED" ?
      new Date()
    : null;

  const deedBlockers = deedAndRegistrationBlockers({
    closing: {
      qcClosingStage: closingBefore.qcClosingStage,
      deedSignedAt,
      landRegisterStatus: options.landRegisterStatus,
      deedActNumber: options.deedActNumber ?? null,
      deedPublicationReference: options.deedPublicationReference ?? null,
    },
    notary,
  });
  if (deedBlockers.length > 0) {
    throw new Error(deedBlockers.join(" "));
  }

  await prisma.dealClosing.update({
    where: { dealId: options.dealId },
    data: {
      deedSignedAt,
      deedActNumber: options.deedActNumber ?? null,
      deedPublicationReference: options.deedPublicationReference ?? null,
      landRegisterStatus: options.landRegisterStatus,
      landRegisterConfirmedAt,
      qcClosingStage: "CLOSED",
      updatedAt: new Date(),
    },
  });

  const closingDateRaw =
    typeof options.closingDate === "string" && options.closingDate.trim() ?
      options.closingDate
    : new Date().toISOString().slice(0, 10);
  const closingDate = new Date(closingDateRaw);

  await confirmClosingExecution({
    dealId: options.dealId,
    actorUserId: options.actorUserId,
    closingDate,
    notes: options.notes ?? "Québec notarial closing completed",
    actionPipelineId: null,
  });

  if (options.releaseKeys) {
    await prisma.dealClosing.update({
      where: { dealId: options.dealId },
      data: {
        keysReleasedAt: new Date(),
        updatedAt: new Date(),
      },
    });
    await appendClosingAudit({
      dealId: options.dealId,
      actorUserId: options.actorUserId,
      eventType: "QC_KEYS_RELEASED",
      note: "Keys released",
      metadataJson: {},
    });
  }

  await appendCoordinationAudit(options.dealId, options.actorUserId, "QC_CLOSED", {
    landRegisterStatus: options.landRegisterStatus,
    keys: Boolean(options.releaseKeys),
  });

  return getQuebecClosingBundle(options.dealId);
}

export async function upsertClosingAdjustment(options: {
  dealId: string;
  actorUserId: string;
  id?: string;
  kind: DealClosingAdjustmentKind;
  label: string;
  amountCents: number;
  buyerOwes?: boolean;
  notes?: string | null;
}) {
  await ensureQuebecClosingSessionDefaults(options.dealId);
  const row =
    options.id ?
      await prisma.dealClosingAdjustment.update({
        where: { id: options.id },
        data: {
          kind: options.kind,
          label: options.label,
          amountCents: options.amountCents,
          buyerOwes: options.buyerOwes ?? false,
          notes: options.notes ?? null,
          updatedAt: new Date(),
        },
      })
    : await prisma.dealClosingAdjustment.create({
        data: {
          dealId: options.dealId,
          kind: options.kind,
          label: options.label,
          amountCents: options.amountCents,
          buyerOwes: options.buyerOwes ?? false,
          notes: options.notes ?? null,
        },
      });

  await appendCoordinationAudit(options.dealId, options.actorUserId, "QC_ADJUSTMENT_UPSERT", { adjustmentId: row.id });
  return row;
}
