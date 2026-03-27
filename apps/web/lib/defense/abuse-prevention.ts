/**
 * Abuse Prevention and Adversarial Behavior – repeat offenders, linked accounts, abuse signals.
 * Graduated enforcement; connects to trust & safety, fraud, referrals, promotions.
 */
import { prisma } from "@/lib/db";
import type { AbuseSignalType } from "@prisma/client";

export type { AbuseSignalType };

/** Record an abuse signal (system or staff). */
export async function recordAbuseSignal(params: {
  userId?: string;
  entityType?: string;
  entityId?: string;
  signalType: AbuseSignalType;
  severity: string;
  payload?: object;
  createdBy?: string;
}) {
  const signal = await prisma.abuseSignal.create({
    data: {
      userId: params.userId,
      entityType: params.entityType,
      entityId: params.entityId,
      signalType: params.signalType,
      severity: params.severity,
      payload: (params.payload as object) ?? undefined,
      createdBy: params.createdBy,
    },
  });
  if (params.userId) {
    await upsertOffenderProfile(params.userId, { addStrike: params.severity !== "LOW" });
  }
  return signal;
}

/** Get or create offender profile; optionally add strike. */
export async function upsertOffenderProfile(
  userId: string,
  options?: { addStrike?: boolean; linkedAccountIds?: string[]; suspendedAt?: Date; bannedAt?: Date }
) {
  const existing = await prisma.offenderProfile.findUnique({ where: { userId } });
  const now = new Date();
  const linkedAccountIds = Array.isArray(options?.linkedAccountIds)
    ? options!.linkedAccountIds.filter((value): value is string => typeof value === "string")
    : Array.isArray(existing?.linkedAccountIds)
      ? (existing.linkedAccountIds as string[]).filter((value): value is string => typeof value === "string")
      : [];
  if (existing) {
    return prisma.offenderProfile.update({
      where: { userId },
      data: {
        strikeCount: options?.addStrike ? existing.strikeCount + 1 : existing.strikeCount,
        lastStrikeAt: options?.addStrike ? now : existing.lastStrikeAt,
        linkedAccountIds,
        suspendedAt: options?.suspendedAt ?? existing.suspendedAt,
        bannedAt: options?.bannedAt ?? existing.bannedAt,
        updatedAt: now,
      },
    });
  }
  return prisma.offenderProfile.create({
    data: {
      userId,
      strikeCount: options?.addStrike ? 1 : 0,
      lastStrikeAt: options?.addStrike ? now : undefined,
      linkedAccountIds,
      suspendedAt: options?.suspendedAt,
      bannedAt: options?.bannedAt,
      updatedAt: now,
    },
  });
}

/** Get offender profile for user. */
export async function getOffenderProfile(userId: string) {
  return prisma.offenderProfile.findUnique({ where: { userId } });
}

/** Get abuse signals for user or entity. */
export async function getAbuseSignals(params: {
  userId?: string;
  entityType?: string;
  entityId?: string;
  signalType?: AbuseSignalType;
  limit?: number;
}) {
  const where: Record<string, unknown> = {};
  if (params.userId) where.userId = params.userId;
  if (params.entityType) where.entityType = params.entityType;
  if (params.entityId) where.entityId = params.entityId;
  if (params.signalType) where.signalType = params.signalType;
  return prisma.abuseSignal.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: params.limit ?? 50,
  });
}

/** Check if user is banned or suspended (for use in booking/auth flows). */
export async function isUserRestricted(userId: string): Promise<{ suspended: boolean; banned: boolean }> {
  const [profile, user] = await Promise.all([
    prisma.offenderProfile.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { accountStatus: true } }),
  ]);
  const fromProfile = {
    suspended: !!profile?.suspendedAt,
    banned: !!profile?.bannedAt,
  };
  const fromAccountStatus =
    user?.accountStatus === "RESTRICTED" || user?.accountStatus === "SUSPENDED"
      ? { suspended: true, banned: false }
      : user?.accountStatus === "BANNED"
        ? { suspended: false, banned: true }
        : { suspended: false, banned: false };
  return {
    suspended: fromProfile.suspended || fromAccountStatus.suspended,
    banned: fromProfile.banned || fromAccountStatus.banned,
  };
}
