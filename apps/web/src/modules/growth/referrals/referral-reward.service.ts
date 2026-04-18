import { prisma } from "@/lib/db";
import type { ReferralRewardKind } from "./referral.types";

/**
 * Queues conceptual rewards only — integrate Stripe/billing before monetary fulfillment.
 * TODO v3: payout integration with idempotent ledger rows.
 */
export async function queueReferralRewardPlaceholder(params: {
  userId: string;
  kind: ReferralRewardKind;
  note: string;
}): Promise<void> {
  await prisma.referralReward.create({
    data: {
      userId: params.userId,
      rewardType: `growth_v2_${params.kind}`,
      value: params.note.slice(0, 500),
    },
  });
}
