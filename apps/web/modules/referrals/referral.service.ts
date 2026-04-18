import { prisma } from "@/lib/db";

export async function listReferralsForUser(userId: string) {
  return prisma.referral.findMany({
    where: { referrerId: userId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      code: true,
      status: true,
      rewardGiven: true,
      rewardCreditsCents: true,
      usedAt: true,
      createdAt: true,
    },
  });
}
