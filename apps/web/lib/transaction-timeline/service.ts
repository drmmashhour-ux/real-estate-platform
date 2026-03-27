/**
 * Transaction Timeline – create, get, advance, complete step, block, assign, cancel, events.
 */

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DEFAULT_STEPS_BY_STAGE, getNextStage } from "./workflows";
import type { TimelineStage, AssignedRole } from "./types";
import type { TimelineEventType } from "./types";

export async function createTimelineForTransaction(transactionId: string) {
  const tx = await prisma.realEstateTransaction.findUnique({
    where: { id: transactionId },
    select: { id: true, propertyIdentityId: true, listingId: true, buyerId: true, sellerId: true, brokerId: true, status: true },
  });
  if (!tx) throw new Error("Transaction not found");
  const existing = await prisma.transactionTimeline.findUnique({ where: { transactionId } });
  if (existing) return existing;

  const stage = mapTransactionStatusToStage(tx.status);
  const timeline = await prisma.transactionTimeline.create({
    data: {
      transactionId,
      propertyIdentityId: tx.propertyIdentityId,
      listingId: tx.listingId,
      buyerId: tx.buyerId,
      sellerId: tx.sellerId,
      brokerId: tx.brokerId,
      currentStage: stage,
      status: "active",
      nextRequiredAction: getNextActionForStage(stage),
    },
  });

  const stepsForStage = DEFAULT_STEPS_BY_STAGE[stage] ?? [];
  for (const def of stepsForStage) {
    await prisma.transactionTimelineStep.create({
      data: {
        timelineId: timeline.id,
        stepCode: def.stepCode,
        stepName: def.stepName,
        stageName: def.stageName,
        status: "pending",
        assignedToRole: def.defaultAssignedRole,
      },
    });
  }

  await addTimelineEvent(timeline.id, "timeline_created", { stage, transactionId }, null);
  return prisma.transactionTimeline.findUnique({
    where: { id: timeline.id },
    include: { steps: true, transaction: true },
  });
}

function mapTransactionStatusToStage(txStatus: string): TimelineStage {
  const m: Record<string, TimelineStage> = {
    offer_submitted: "offer_submitted",
    negotiation: "negotiation",
    offer_accepted: "offer_accepted",
    deposit_required: "deposit_pending",
    deposit_received: "deposit_received",
    contract_signed: "legal_documents_prepared",
    closing_in_progress: "notary_review",
    completed: "closing_completed",
    cancelled: "cancelled",
  };
  return m[txStatus] ?? "offer_submitted";
}

function getNextActionForStage(stage: TimelineStage): string {
  const actions: Record<string, string> = {
    offer_submitted: "Seller to review offer",
    negotiation: "Continue negotiation or accept offer",
    offer_accepted: "Proceed to deposit",
    deposit_pending: "Buyer to pay deposit",
    deposit_received: "Proceed to inspection if required",
    inspection_pending: "Complete inspection",
    financing_pending: "Confirm financing",
    legal_documents_prepared: "Generate and sign documents",
    notary_review: "Notary to review package",
    closing_scheduled: "Complete closing",
    closing_completed: "Transaction complete",
    cancelled: "Transaction cancelled",
  };
  return actions[stage] ?? "Next step required";
}

export async function getTimelineByTransactionId(transactionId: string) {
  return prisma.transactionTimeline.findUnique({
    where: { transactionId },
    include: {
      steps: { orderBy: [{ createdAt: "asc" }] },
      transaction: { select: { id: true, status: true, offerPrice: true } },
    },
  });
}

export async function getTimelineSteps(transactionId: string) {
  const timeline = await prisma.transactionTimeline.findUnique({
    where: { transactionId },
    select: { id: true },
  });
  if (!timeline) return [];
  return prisma.transactionTimelineStep.findMany({
    where: { timelineId: timeline.id },
    orderBy: [{ createdAt: "asc" }],
  });
}

export async function getTimelineEvents(transactionId: string, limit = 50) {
  const timeline = await prisma.transactionTimeline.findUnique({
    where: { transactionId },
    select: { id: true },
  });
  if (!timeline) return [];
  return prisma.transactionTimelineEvent.findMany({
    where: { timelineId: timeline.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function addTimelineEvent(
  timelineId: string,
  eventType: TimelineEventType,
  eventData: Record<string, unknown>,
  createdBy: string | null
) {
  return prisma.transactionTimelineEvent.create({
    data: { timelineId, eventType, eventData: eventData as Prisma.InputJsonValue, createdBy },
  });
}

export async function advanceTimeline(transactionId: string, newStage: TimelineStage, userId: string) {
  const timeline = await prisma.transactionTimeline.findUnique({ where: { transactionId } });
  if (!timeline) throw new Error("Timeline not found");
  if (timeline.status === "cancelled") throw new Error("Cannot advance cancelled timeline");

  const next = getNextStage(timeline.currentStage as TimelineStage);
  const updated = await prisma.transactionTimeline.update({
    where: { id: timeline.id },
    data: {
      currentStage: newStage,
      nextRequiredAction: getNextActionForStage(newStage),
    },
  });

  const stepsForStage = DEFAULT_STEPS_BY_STAGE[newStage] ?? [];
  for (const def of stepsForStage) {
    await prisma.transactionTimelineStep.create({
      data: {
        timelineId: timeline.id,
        stepCode: def.stepCode,
        stepName: def.stepName,
        stageName: def.stageName,
        status: "pending",
        assignedToRole: def.defaultAssignedRole,
      },
    });
  }

  await addTimelineEvent(
    timeline.id,
    "stage_changed",
    { fromStage: timeline.currentStage, toStage: newStage },
    userId
  );
  return prisma.transactionTimeline.findUnique({
    where: { id: timeline.id },
    include: { steps: true },
  });
}

export async function completeStep(transactionId: string, stepId: string, userId: string, notes?: string | null) {
  const timeline = await prisma.transactionTimeline.findUnique({ where: { transactionId } });
  if (!timeline) throw new Error("Timeline not found");
  const step = await prisma.transactionTimelineStep.findFirst({
    where: { id: stepId, timelineId: timeline.id },
  });
  if (!step) throw new Error("Step not found");

  await prisma.transactionTimelineStep.update({
    where: { id: stepId },
    data: { status: "completed", completedAt: new Date(), completedByUserId: userId, notes: notes ?? undefined },
  });
  await addTimelineEvent(
    timeline.id,
    "step_completed",
    { stepId, stepCode: step.stepCode, stepName: step.stepName },
    userId
  );
  return getTimelineByTransactionId(transactionId);
}

export async function blockStep(transactionId: string, stepId: string, userId: string, reason?: string | null) {
  const timeline = await prisma.transactionTimeline.findUnique({ where: { transactionId } });
  if (!timeline) throw new Error("Timeline not found");
  const step = await prisma.transactionTimelineStep.findFirst({
    where: { id: stepId, timelineId: timeline.id },
  });
  if (!step) throw new Error("Step not found");

  await prisma.transactionTimelineStep.update({
    where: { id: stepId },
    data: { status: "blocked", notes: reason ?? step.notes ?? undefined },
  });
  await prisma.transactionTimeline.update({
    where: { id: timeline.id },
    data: { status: "blocked" },
  });
  await addTimelineEvent(timeline.id, "step_blocked", { stepId, stepCode: step.stepCode, reason }, userId);
  return getTimelineByTransactionId(transactionId);
}

export async function assignStep(
  transactionId: string,
  stepId: string,
  assignedToRole: AssignedRole,
  assignedToUserId?: string | null
) {
  const timeline = await prisma.transactionTimeline.findUnique({ where: { transactionId } });
  if (!timeline) throw new Error("Timeline not found");
  const step = await prisma.transactionTimelineStep.findFirst({
    where: { id: stepId, timelineId: timeline.id },
  });
  if (!step) throw new Error("Step not found");

  await prisma.transactionTimelineStep.update({
    where: { id: stepId },
    data: { assignedToRole, assignedToUserId: assignedToUserId ?? undefined },
  });
  return getTimelineByTransactionId(transactionId);
}

export async function cancelTimeline(transactionId: string, reason: string, userId: string) {
  const timeline = await prisma.transactionTimeline.findUnique({ where: { transactionId } });
  if (!timeline) throw new Error("Timeline not found");

  await prisma.transactionTimeline.update({
    where: { id: timeline.id },
    data: {
      status: "cancelled",
      currentStage: "cancelled",
      cancelledReason: reason,
      cancelledAt: new Date(),
      nextRequiredAction: null,
    },
  });
  await prisma.transactionTimelineStep.updateMany({
    where: { timelineId: timeline.id, status: { in: ["pending", "in_progress"] } },
    data: { status: "cancelled" },
  });
  await addTimelineEvent(timeline.id, "transaction_cancelled", { reason }, userId);
  return getTimelineByTransactionId(transactionId);
}

export async function addInspectionStep(
  transactionId: string,
  payload: { scheduledDate?: Date; deadline?: Date; status?: string },
  userId: string
) {
  const timeline = await prisma.transactionTimeline.findUnique({ where: { transactionId } });
  if (!timeline) throw new Error("Timeline not found");

  await prisma.transactionTimelineStep.create({
    data: {
      timelineId: timeline.id,
      stepCode: "inspection_add",
      stepName: "Inspection",
      stageName: timeline.currentStage,
      status: payload.status ?? "pending",
      assignedToRole: "buyer",
      dueDate: payload.deadline ?? payload.scheduledDate ?? undefined,
      metadata: payload as object,
    },
  });
  await addTimelineEvent(timeline.id, "inspection_completed", payload, userId);
  return getTimelineByTransactionId(transactionId);
}

export async function addFinancingStatus(
  transactionId: string,
  payload: { status: "pending" | "approved" | "denied" | "waived"; lenderRef?: string },
  userId: string
) {
  const timeline = await prisma.transactionTimeline.findUnique({ where: { transactionId } });
  if (!timeline) throw new Error("Timeline not found");

  await prisma.transactionTimelineStep.create({
    data: {
      timelineId: timeline.id,
      stepCode: "financing_status",
      stepName: "Financing: " + payload.status,
      stageName: "financing_pending",
      status: payload.status === "approved" || payload.status === "waived" ? "completed" : "pending",
      assignedToRole: "buyer",
      metadata: payload as object,
    },
  });
  const evType = payload.status === "approved" ? "financing_approved" : payload.status === "denied" ? "financing_denied" : "financing_waived";
  await addTimelineEvent(timeline.id, evType as TimelineEventType, payload, userId);
  return getTimelineByTransactionId(transactionId);
}
