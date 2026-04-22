import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";

const TAG = "[growth.referralEngine]";

function defaultCreditAward(): number {
  const raw = process.env.LECIPM_REFERRAL_REWARD_CREDITS ?? "50";
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 50;
}

/** When a referred broker proves value (signup match), grant credits + free-usage signal. */
export async function grantReferralReward(referralId: string): Promise<{ ok: boolean }> {
  const ref = await prisma.lecipmBrokerLaunchReferral.findUnique({
    where: { id: referralId },
    select: { id: true, rewardGiven: true, referrerUserId: true },
  });
  if (!ref || ref.rewardGiven) return { ok: false };

  const credits = defaultCreditAward();

  await prisma.$transaction([
    prisma.lecipmBrokerLaunchReferral.update({
      where: { id: referralId },
      data: {
        rewardGiven: true,
        rewardCredits: credits,
      },
    }),
    prisma.lecipmBrokerUsageEvent.create({
      data: {
        userId: ref.referrerUserId,
        type: "LEAD",
        amount: 0,
        metaJson: { referralReward: true, referralId, credits, note: "Referral bonus (credits)" },
      },
    }),
  ]);

  logInfo(TAG, { referralId, referrerUserId: ref.referrerUserId, credits });
  return { ok: true };
}
