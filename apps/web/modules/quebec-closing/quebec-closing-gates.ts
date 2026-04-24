import type { DealClosing, DealClosingCondition, DealNotaryCoordination, DealQuebecNotaryChecklistItem } from "@prisma/client";
import type { QcClosingStage } from "@/modules/quebec-closing/quebec-closing.types";
import { QC_NOTARY_CHECKLIST_KEYS } from "@/modules/quebec-closing/quebec-closing.types";

export function deriveInitialQcStage(dealStatus: string, conditions: { status: string }[]): QcClosingStage {
  const unresolved = conditions.filter((c) => c.status !== "fulfilled" && c.status !== "waived");
  if (unresolved.length > 0) return "CONDITIONS_PENDING";
  if (["accepted", "inspection", "financing", "closing_scheduled", "closed"].includes(dealStatus)) {
    return "CONDITIONS_SATISFIED";
  }
  if (dealStatus === "offer_submitted") return "OFFER_ACCEPTED";
  return "OFFER_SENT";
}

export function isQcWorkflowActive(closing: Pick<DealClosing, "qcClosingStage" | "qcWorkflowStartedAt"> | null): boolean {
  return Boolean(closing?.qcClosingStage || closing?.qcWorkflowStartedAt);
}

export function isConditionResolved(c: Pick<DealClosingCondition, "status">): boolean {
  return c.status === "fulfilled" || c.status === "waived";
}

export function isConditionFailed(c: Pick<DealClosingCondition, "status" | "failedAt">): boolean {
  return c.status === "failed" || Boolean(c.failedAt);
}

export function notaryAssignmentComplete(
  row: Pick<
    DealNotaryCoordination,
    "notaryId" | "notaryDisplayName" | "notaryEmail" | "notaryPhone"
  > | null,
): boolean {
  if (!row) return false;
  if (row.notaryId) return true;
  const name = row.notaryDisplayName?.trim();
  const contact = row.notaryEmail?.trim() || row.notaryPhone?.trim();
  return Boolean(name && contact);
}

export function notaryChecklistTerminal(items: DealQuebecNotaryChecklistItem[]): boolean {
  const byKey = new Map(items.map((i) => [i.itemKey, i]));
  for (const key of QC_NOTARY_CHECKLIST_KEYS) {
    const row = byKey.get(key);
    if (!row || row.status === "PENDING") return false;
  }
  return true;
}

export function qcLandRegisterBlocksClose(
  closing: Pick<DealClosing, "landRegisterStatus" | "qcClosingStage"> | null,
): boolean {
  if (!closing?.qcClosingStage) return false;
  if (closing.landRegisterStatus === "PENDING") return true;
  return false;
}

/** Blockers for final closing-room readiness (orchestrator) when Québec workflow is active. */
export function qcExecutionBlockers(input: {
  closing: Pick<
    DealClosing,
    | "qcClosingStage"
    | "landRegisterStatus"
    | "deedSignedAt"
    | "closingPacketMarkedCompleteAt"
    | "qcWorkflowStartedAt"
  > | null;
  conditions: DealClosingCondition[];
  notary: DealNotaryCoordination | null;
  notaryChecklist: DealQuebecNotaryChecklistItem[];
}): string[] {
  const blockers: string[] = [];
  if (!isQcWorkflowActive(input.closing)) return blockers;

  for (const c of input.conditions) {
    if (!c.deadline) {
      blockers.push(`Québec workflow: condition “${c.conditionType}” is missing an explicit deadline.`);
    }
    if (isConditionFailed(c)) {
      blockers.push(`Québec workflow: condition “${c.conditionType}” is failed — resolve before closing.`);
    }
  }

  const unresolved = input.conditions.filter((c) => !isConditionResolved(c) && !isConditionFailed(c));
  for (const c of unresolved) {
    blockers.push(`Québec workflow: condition “${c.conditionType}” is still pending.`);
  }

  if (unresolved.length > 0 || input.conditions.some(isConditionFailed)) {
    return blockers;
  }

  if (!notaryAssignmentComplete(input.notary)) {
    blockers.push("Québec workflow: notary must be assigned (directory notary or display name + email/phone).");
  }

  const packetOk =
    Boolean(input.closing?.closingPacketMarkedCompleteAt) ||
    notaryChecklistTerminal(input.notaryChecklist);
  if (!packetOk) {
    blockers.push(
      "Québec workflow: closing packet / notary checklist incomplete — complete checklist items or broker-mark the packet.",
    );
  }

  if (input.closing?.deedSignedAt && input.closing.landRegisterStatus === "PENDING") {
    blockers.push("Québec workflow: land register publication still pending — confirm registration before final close.");
  }

  return blockers;
}

/** Gate: move to SIGNING_SCHEDULED */
export function signingScheduledBlockers(input: {
  closing: DealClosing | null;
  conditions: DealClosingCondition[];
  notary: DealNotaryCoordination | null;
  notaryChecklist: DealQuebecNotaryChecklistItem[];
  baseReadinessReady: boolean;
  currentStage: QcClosingStage | null;
}): string[] {
  const blockers: string[] = [];
  if (!input.currentStage) {
    blockers.push("Québec workflow has not been initialized on this closing session.");
    return blockers;
  }
  if (!input.baseReadinessReady) {
    blockers.push("Closing room readiness is not READY (documents, checklist, or signatures).");
  }
  blockers.push(
    ...qcExecutionBlockers({
      closing: input.closing,
      conditions: input.conditions,
      notary: input.notary,
      notaryChecklist: input.notaryChecklist,
    }),
  );
  return blockers.filter(Boolean);
}

/** Gate: CRM / session CLOSED via confirmClosingExecution */
export function deedAndRegistrationBlockers(input: {
  closing: Pick<
    DealClosing,
    "qcClosingStage" | "deedSignedAt" | "landRegisterStatus" | "deedActNumber" | "deedPublicationReference"
  > | null;
  notary: DealNotaryCoordination | null;
}): string[] {
  const blockers: string[] = [];
  if (!isQcWorkflowActive(input.closing)) return blockers;

  if (!notaryAssignmentComplete(input.notary)) {
    blockers.push("Cannot mark closed: notary assignment is incomplete.");
  }
  if (!input.closing?.deedSignedAt) {
    blockers.push("Cannot mark closed: deed signing is not recorded (deedSignedAt).");
  }
  const hasDeedRef = Boolean(
    input.closing?.deedActNumber?.trim() || input.closing?.deedPublicationReference?.trim(),
  );
  if (!hasDeedRef) {
    blockers.push("Cannot mark closed: deed reference data missing (act number or publication reference).");
  }
  const lr = input.closing?.landRegisterStatus;
  if (lr !== "CONFIRMED" && lr !== "NOT_APPLICABLE") {
    blockers.push("Cannot mark closed: land register must be CONFIRMED or NOT_APPLICABLE.");
  }
  return blockers;
}
