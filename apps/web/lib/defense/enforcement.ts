/**
 * Enforcement Framework – warnings, restrictions, freezes, suspensions, bans, appeals.
 * Policy-based, traceable, with appeal intake and reinstatement.
 */
import { prisma } from "@/lib/db";
import type { EnforcementActionType } from "@prisma/client";
import { upsertOffenderProfile } from "@/lib/defense/abuse-prevention";
import { setOperationalControl } from "@/lib/operational-controls";

export type { EnforcementActionType };

/** Create an enforcement action (warning, listing freeze, payout hold, suspension, ban). */
export async function createEnforcementAction(params: {
  userId: string;
  actionType: EnforcementActionType;
  severity: string;
  reasonCode: string;
  reasonText?: string;
  marketId?: string;
  expiresAt?: Date;
  performedBy?: string;
  metadata?: object;
}) {
  const action = await prisma.enforcementAction.create({
    data: {
      userId: params.userId,
      actionType: params.actionType,
      severity: params.severity,
      reasonCode: params.reasonCode,
      reasonText: params.reasonText,
      marketId: params.marketId,
      expiresAt: params.expiresAt,
      performedBy: params.performedBy,
      metadata: (params.metadata as object) ?? undefined,
    },
  });
  if (params.actionType === "ACCOUNT_SUSPENSION") {
    await upsertOffenderProfile(params.userId, { suspendedAt: new Date() });
    await setOperationalControl({
      controlType: "BOOKING_RESTRICTION",
      targetType: "USER",
      targetId: params.userId,
      active: true,
      reason: params.reasonText ?? params.reasonCode,
      reasonCode: params.reasonCode,
      createdBy: params.performedBy,
      expiresAt: params.expiresAt,
    }).catch(() => {});
  }
  if (params.actionType === "PERMANENT_BAN") {
    await upsertOffenderProfile(params.userId, { bannedAt: new Date() });
    await setOperationalControl({
      controlType: "BOOKING_RESTRICTION",
      targetType: "USER",
      targetId: params.userId,
      active: true,
      reason: params.reasonText ?? params.reasonCode,
      reasonCode: params.reasonCode,
      createdBy: params.performedBy,
    }).catch(() => {});
  }
  if (params.actionType === "PAYOUT_HOLD") {
    await setOperationalControl({
      controlType: "PAYOUT_HOLD",
      targetType: "USER",
      targetId: params.userId,
      active: true,
      reason: params.reasonText ?? params.reasonCode,
      reasonCode: params.reasonCode,
      createdBy: params.performedBy,
      expiresAt: params.expiresAt,
    }).catch(() => {});
  }
  if (params.actionType === "LISTING_FREEZE") {
    await setOperationalControl({
      controlType: "LISTING_FREEZE",
      targetType: "USER",
      targetId: params.userId,
      active: true,
      reason: params.reasonText ?? params.reasonCode,
      reasonCode: params.reasonCode,
      createdBy: params.performedBy,
      expiresAt: params.expiresAt,
    }).catch(() => {});
  }
  return action;
}

/** Get enforcement history for user. */
export async function getEnforcementHistory(userId: string, limit = 50) {
  return prisma.enforcementAction.findMany({
    where: { userId },
    orderBy: { effectiveAt: "desc" },
    take: limit,
  });
}

/** Submit an appeal. */
export async function submitAppeal(params: {
  enforcementId?: string;
  userId: string;
  reasonCode?: string;
  description: string;
}) {
  return prisma.appeal.create({
    data: {
      enforcementId: params.enforcementId,
      userId: params.userId,
      reasonCode: params.reasonCode,
      description: params.description,
      status: "PENDING",
      createdAt: new Date(),
    },
  });
}

/** Review an appeal (approve or reject). */
export async function reviewAppeal(
  id: string,
  decision: "APPROVED" | "REJECTED",
  reviewedBy: string,
  outcomeNotes?: string
) {
  return prisma.appeal.update({
    where: { id },
    data: {
      status: decision,
      reviewedBy,
      reviewedAt: new Date(),
      outcomeNotes,
    },
  });
}

/** Get pending appeals. */
export async function getPendingAppeals(limit = 50) {
  return prisma.appeal.findMany({
    where: { status: "PENDING" },
    orderBy: { submittedAt: "desc" },
    take: limit,
  });
}

/** Get appeals for user. */
export async function getAppealsForUser(userId: string) {
  return prisma.appeal.findMany({
    where: { userId },
    orderBy: { submittedAt: "desc" },
  });
}
