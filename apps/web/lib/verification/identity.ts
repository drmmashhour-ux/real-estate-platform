/**
 * Triple verification (2): Identity verification of the lister.
 * User uploads government ID and selfie; admin or verification service confirms identity.
 * For owner listings: user name must match owner_name from land register document.
 */

import { prisma } from "@/lib/db";
import type { VerificationStatus } from "@prisma/client";

export type IdentityVerificationStatus = VerificationStatus;

export async function getIdentityVerification(userId: string) {
  return prisma.identityVerification.findUnique({
    where: { userId },
  });
}

export async function upsertIdentityVerification(params: {
  userId: string;
  governmentIdFileUrl?: string | null;
  selfiePhotoUrl?: string | null;
}) {
  return prisma.identityVerification.upsert({
    where: { userId: params.userId },
    create: {
      userId: params.userId,
      governmentIdFileUrl: params.governmentIdFileUrl ?? null,
      selfiePhotoUrl: params.selfiePhotoUrl ?? null,
      verificationStatus: "PENDING",
    },
    update: {
      ...(params.governmentIdFileUrl !== undefined && { governmentIdFileUrl: params.governmentIdFileUrl }),
      ...(params.selfiePhotoUrl !== undefined && { selfiePhotoUrl: params.selfiePhotoUrl }),
    },
  });
}

export async function setIdentityVerificationDecision(
  userId: string,
  status: VerificationStatus,
  adminUserId: string,
  notes?: string | null
) {
  return prisma.identityVerification.update({
    where: { userId },
    data: {
      verificationStatus: status,
      verifiedById: adminUserId,
      verifiedAt: status === "VERIFIED" ? new Date() : null,
      notes: notes ?? undefined,
    },
  });
}

export async function isIdentityVerified(userId: string): Promise<boolean> {
  const r = await prisma.identityVerification.findUnique({
    where: { userId },
    select: { verificationStatus: true },
  });
  return r?.verificationStatus === "VERIFIED";
}
