"use server";

import type { FraudCaseStatus } from "@prisma/client";
import { AccountStatus, ListingStatus } from "@prisma/client";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { prisma } from "@/lib/db";

async function requireAdmin() {
  const a = await requireAdminSession();
  if (!a.ok) throw new Error(a.error);
  return a.userId;
}

export async function recordFraudDecisionAction(params: {
  caseId: string;
  actionLabel: string;
  notes?: string;
}): Promise<void> {
  const adminId = await requireAdmin();
  await prisma.fraudDecision.create({
    data: {
      fraudCaseId: params.caseId,
      actionType: "review",
      decidedByUserId: adminId,
      notes: params.notes?.slice(0, 4000) ?? `note: ${params.actionLabel}`,
    },
  });
}

export async function setFraudCaseStatusAction(caseId: string, status: FraudCaseStatus, notes?: string): Promise<void> {
  const adminId = await requireAdmin();
  await prisma.fraudCase.update({
    where: { id: caseId },
    data: { status },
  });
  await prisma.fraudDecision.create({
    data: {
      fraudCaseId: caseId,
      actionType: status === "false_positive" ? "allow" : status === "confirmed_fraud" ? "block" : "review",
      decidedByUserId: adminId,
      notes: notes?.slice(0, 4000),
    },
  });
}

/** Reversible: suspend user for investigation (admin can restore ACTIVE later). */
export async function suspendUserForCaseAction(caseId: string): Promise<void> {
  await requireAdmin();
  const c = await prisma.fraudCase.findUnique({ where: { id: caseId } });
  if (!c || c.entityType !== "user") throw new Error("Case is not a user entity");
  if (c.entityId.startsWith("ip:")) {
    throw new Error("IP-only fraud bucket — use Security → IP block instead of user suspend.");
  }
  await prisma.user.update({
    where: { id: c.entityId },
    data: { accountStatus: AccountStatus.SUSPENDED },
  });
  await recordFraudDecisionAction({ caseId, actionLabel: "suspend_user", notes: "accountStatus=SUSPENDED" });
}

/** Reversible: put listing under investigation. */
export async function holdListingForCaseAction(caseId: string): Promise<void> {
  await requireAdmin();
  const c = await prisma.fraudCase.findUnique({ where: { id: caseId } });
  if (!c || c.entityType !== "listing") throw new Error("Case is not a listing entity");
  await prisma.shortTermListing.update({
    where: { id: c.entityId },
    data: { listingStatus: ListingStatus.UNDER_INVESTIGATION },
  });
  await recordFraudDecisionAction({ caseId, actionLabel: "listing_under_investigation" });
}

export async function restoreUserActiveAction(caseId: string, userId: string): Promise<void> {
  await requireAdmin();
  await prisma.user.update({
    where: { id: userId },
    data: { accountStatus: AccountStatus.ACTIVE },
  });
  await recordFraudDecisionAction({ caseId, actionLabel: "restore_user_active" });
}
