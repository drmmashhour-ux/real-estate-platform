import { prisma } from "@/lib/db";
import { generateViralReferralInstanceCode } from "@/lib/referrals/code";

export { generateReferralCode, generateViralReferralInstanceCode, ensureReferralCode } from "@/lib/referrals/code";
export type { ReferralAttribution } from "@/lib/referrals/viral";
export {
  VIRAL_REF_COOKIE,
  VIRAL_REF_COOKIE_MAX_AGE,
  normalizeSignupRefParam,
  resolveReferralAttribution,
  computeViralCoefficientForReferrer,
} from "@/lib/referrals/viral";

/**
 * Referral engine — user→user and host→host (`ref_kind=HOST` on signup).
 * 10K scale: pair credits with ops “visibility boost” (featured rotation, local newsletter) for top recruiters — see docs/10k-scaling-system.md.
 */

export async function createReferralIfNeeded(
  referrerPublicCode: string | null | undefined,
  referredId: string,
  opts?: { inviteKind?: string | null }
) {
  if (!referrerPublicCode) return null;
  const upper = referrerPublicCode.trim().toUpperCase();
  const referrer = await prisma.user.findFirst({ where: { referralCode: upper } });
  if (!referrer) return null;
  if (referrer.id === referredId) return null;
  const existing = await prisma.referral.findFirst({ where: { referrerId: referrer.id, usedByUserId: referredId } });
  if (existing) return existing;
  const kind = opts?.inviteKind?.trim().toUpperCase().slice(0, 24) || null;

  for (let i = 0; i < 8; i++) {
    const instanceCode = generateViralReferralInstanceCode();
    try {
      return await prisma.referral.create({
        data: {
          referrerId: referrer.id,
          code: instanceCode,
          referralPublicCode: upper,
          usedByUserId: referredId,
          inviteKind: kind,
          rewardCreditsCents: 500,
          programId: null,
          usedAt: null,
          status: "joined",
          rewardGiven: false,
        },
      });
    } catch {
      // collision on code — retry
    }
  }
  return null;
}

export async function rewardReferralActivation(referredId: string) {
  const rows = await prisma.referral.findMany({
    where: { usedByUserId: referredId, rewardGiven: false },
    select: { id: true, referrerId: true, code: true, referralPublicCode: true },
  });
  if (rows.length === 0) return;

  await prisma.referral.updateMany({
    where: { usedByUserId: referredId, rewardGiven: false },
    data: { usedAt: new Date(), rewardCreditsCents: 500, status: "converted", rewardGiven: true },
  });

  const program = await prisma.referralProgram.findFirst({ where: { active: true } }).catch(() => null);
  const refCents = program?.rewardCreditsReferrer ?? 500;
  const refeeCents = program?.rewardCreditsReferee ?? 500;

  let refereeCredited = false;
  for (const row of rows) {
    await prisma.referralReward
      .create({
        data: {
          userId: row.referrerId,
          rewardType: "credits",
          value: String(refCents),
        },
      })
      .catch(() => {});
    if (!refereeCredited) {
      refereeCredited = true;
      await prisma.referralReward
        .create({
          data: {
            userId: referredId,
            rewardType: "credits",
            value: String(refeeCents),
          },
        })
        .catch(() => {});
    }
  }
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
