import { prisma } from "@/lib/db";

export type BrokerReferralReward = "priority_routing" | "credit_discount_v1";

/**
 * Broker-to-broker invite (stored on existing `LecipmBrokerLaunchReferral`).
 * Rewards are not auto-fulfilled — `rewardGiven` is for billing/ops to apply priority routing or a credit.
 */
export async function createBrokerToBrokerReferral(
  referrerUserId: string,
  referredEmail: string,
  reward: BrokerReferralReward = "priority_routing"
) {
  const email = referredEmail.trim().toLowerCase();
  const row = await prisma.lecipmBrokerLaunchReferral.create({
    data: {
      referrerUserId,
      referredEmail: email.slice(0, 320),
      rewardGiven: false,
      rewardCredits: 0,
    },
  });
  return {
    id: row.id,
    reward,
    /**
     * Human-readable promise — honor manually or via billing integration.
     */
    benefitSummary:
      reward === "priority_routing"
        ? "Invited broker may receive short-term priority on compatible inbound leads in your market (when product rules allow)."
        : "Invited broker may be eligible for a platform credit on first qualified subscription (ops review).",
  };
}
