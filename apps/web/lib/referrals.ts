import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

export function generateReferralCode(prefix = "USER"): string {
  return `${prefix}${randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function ensureReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
  if (user?.referralCode) return user.referralCode;
  const code = generateReferralCode();
  await prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
  return code;
}

export async function createReferralIfNeeded(referrerCode: string | null | undefined, referredId: string) {
  if (!referrerCode) return null;
  const referrer = await prisma.user.findFirst({ where: { referralCode: referrerCode } });
  if (!referrer) return null;
  if (referrer.id === referredId) return null;
  const existing = await prisma.referral.findFirst({ where: { referrerId: referrer.id, usedByUserId: referredId } });
  if (existing) return existing;
  return prisma.referral.create({
    data: {
      referrerId: referrer.id,
      code: referrerCode,
      usedByUserId: referredId,
      rewardCreditsCents: 500,
      programId: null,
      usedAt: null,
    },
  });
}

export async function rewardReferralActivation(referredId: string) {
  await prisma.referral.updateMany({
    where: { usedByUserId: referredId },
    data: { usedAt: new Date(), rewardCreditsCents: 500 },
  });
  await prisma.referralEvent.createMany({
    data: await (async () => {
      const referral = await prisma.referral.findFirst({ where: { usedByUserId: referredId }, select: { code: true } }).catch(() => null);
      return referral?.code ? [{ code: referral.code, eventType: "activated", userId: referredId }] : [];
    })(),
  }).catch(() => {});
}

export async function addCommissionForUser(userId: string, sourceType: string, sourceId: string, amount: number) {
  const ambassador = await prisma.ambassador.findFirst({ where: { userId, isActive: true } });
  if (!ambassador) return null;
  return prisma.commission.create({
    data: {
      ambassadorId: ambassador.id,
      amount: amount * ambassador.commission,
      sourceType,
      sourceId,
    },
  });
}

export async function addCommissionForReferral(userId: string, sourceType: string, sourceId: string, amount: number) {
  const referral = await prisma.referral.findFirst({ where: { usedByUserId: userId } });
  if (!referral) return null;
  const ambassador = await prisma.ambassador.findFirst({ where: { userId: referral.referrerId, isActive: true } });
  if (!ambassador) return null;
  return prisma.commission.create({
    data: {
      ambassadorId: ambassador.id,
      amount: amount * ambassador.commission,
      sourceType,
      sourceId,
    },
  });
}
