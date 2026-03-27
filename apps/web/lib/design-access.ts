/**
 * Design feature access: 7-day trial, then require payment.
 * Applies to platform design features (templates, design studio), not Canva account.
 */

import { prisma } from "@/lib/db";

const TRIAL_DAYS = 7;
export const DESIGN_ACCESS_AMOUNT = 5;

export type DesignAccessStatus = {
  allowed: boolean;
  trialStart: string | null;
  trialEnd: string | null;
  isPaid: boolean;
  daysLeft: number | null;
};

export function isAccessAllowed(trialEnd: Date, isPaid: boolean): boolean {
  if (isPaid) return true;
  return new Date() <= trialEnd;
}

export function daysLeft(trialEnd: Date): number {
  const now = new Date();
  if (now > trialEnd) return 0;
  const ms = trialEnd.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export async function getOrCreateDesignAccess(userId: string): Promise<{
  access: Awaited<ReturnType<typeof getDesignAccess>>;
  created: boolean;
}> {
  const existing = await prisma.designAccess.findUnique({
    where: { userId },
  });

  if (existing) {
    return { access: existing, created: false };
  }

  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);

  const access = await prisma.designAccess.create({
    data: {
      userId,
      trialStart: now,
      trialEnd,
      isPaid: false,
    },
  });

  return { access, created: true };
}

export async function getDesignAccess(userId: string) {
  return prisma.designAccess.findUnique({
    where: { userId },
  });
}

export async function getDesignAccessStatus(userId: string): Promise<DesignAccessStatus | null> {
  const access = await getDesignAccess(userId);
  if (!access) {
    return {
      allowed: true,
      trialStart: null,
      trialEnd: null,
      isPaid: false,
      daysLeft: null,
    };
  }

  const allowed = isAccessAllowed(access.trialEnd, access.isPaid);
  return {
    allowed,
    trialStart: access.trialStart.toISOString(),
    trialEnd: access.trialEnd.toISOString(),
    isPaid: access.isPaid,
    daysLeft: daysLeft(access.trialEnd),
  };
}
