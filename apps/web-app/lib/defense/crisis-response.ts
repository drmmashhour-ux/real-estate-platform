/**
 * Crisis Response and Emergency Defense – crisis events, action log, regional freezes.
 * Connects with operational controls, observability, trust & safety.
 */
import { prisma } from "@/lib/db";
import type { CrisisSeverity } from "@prisma/client";
import { setOperationalControl } from "@/lib/operational-controls";

export type { CrisisSeverity };

/** Create a crisis event and optionally apply emergency controls. */
export async function createCrisisEvent(params: {
  title: string;
  severity: CrisisSeverity;
  region?: string;
  playbookRef?: string;
  summary?: string;
  createdBy?: string;
}) {
  return prisma.crisisEvent.create({
    data: {
      title: params.title,
      severity: params.severity,
      status: "ACTIVE",
      region: params.region,
      playbookRef: params.playbookRef,
      summary: params.summary,
    },
  });
}

/** Log a crisis action (booking freeze, payout freeze, takedown, escalation). */
export async function logCrisisAction(params: {
  crisisId: string;
  actionType: string;
  targetType?: string;
  targetId?: string;
  performedBy: string;
  reasonCode?: string;
  payload?: object;
}) {
  return prisma.crisisActionLog.create({
    data: {
      crisisId: params.crisisId,
      actionType: params.actionType,
      targetType: params.targetType,
      targetId: params.targetId,
      performedBy: params.performedBy,
      reasonCode: params.reasonCode,
      payload: (params.payload as object) ?? undefined,
    },
  });
}

/** Apply emergency booking freeze for region (creates OperationalControl). */
export async function applyEmergencyBookingFreeze(region: string, performedBy: string, crisisId: string) {
  const control = await setOperationalControl({
    controlType: "BOOKING_RESTRICTION",
    targetType: "REGION",
    targetId: region,
    active: true,
    reason: "Crisis emergency booking freeze",
    reasonCode: "CRISIS_BOOKING_FREEZE",
    createdBy: performedBy,
  });
  await logCrisisAction({
    crisisId,
    actionType: "BOOKING_FREEZE",
    targetType: "REGION",
    targetId: region,
    performedBy,
    reasonCode: "CRISIS_BOOKING_FREEZE",
    payload: { controlId: control.id },
  });
  return control;
}

/** Apply emergency payout freeze for region. */
export async function applyEmergencyPayoutFreeze(region: string, performedBy: string, crisisId: string) {
  const control = await setOperationalControl({
    controlType: "PAYOUT_HOLD",
    targetType: "REGION",
    targetId: region,
    active: true,
    reason: "Crisis emergency payout freeze",
    reasonCode: "CRISIS_PAYOUT_FREEZE",
    createdBy: performedBy,
  });
  await logCrisisAction({
    crisisId,
    actionType: "PAYOUT_FREEZE",
    targetType: "REGION",
    targetId: region,
    performedBy,
    reasonCode: "CRISIS_PAYOUT_FREEZE",
    payload: { controlId: control.id },
  });
  return control;
}

/** Resolve a crisis event. */
export async function resolveCrisisEvent(id: string, resolvedBy: string, summary?: string) {
  return prisma.crisisEvent.update({
    where: { id },
    data: { status: "RESOLVED", resolvedAt: new Date(), resolvedBy, summary },
  });
}

/** Get active crisis events. */
export async function getActiveCrisisEvents() {
  return prisma.crisisEvent.findMany({
    where: { status: "ACTIVE" },
    include: { actionLogs: { orderBy: { createdAt: "desc" }, take: 20 } },
    orderBy: { startedAt: "desc" },
  });
}

/** Get crisis timeline (event + actions). */
export async function getCrisisTimeline(crisisId: string) {
  const event = await prisma.crisisEvent.findUnique({
    where: { id: crisisId },
    include: { actionLogs: { orderBy: { createdAt: "asc" } } },
  });
  return event;
}
