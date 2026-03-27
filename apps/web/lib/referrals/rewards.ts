import { prisma } from "@/lib/db";

export type ReferralLevel = "Starter" | "Connector" | "Ambassador" | "Elite Partner";

export async function evaluateReferralRewards(userId: string) {
  const [activated, paid, activeRewards] = await Promise.all([
    prisma.referral.count({ where: { referrerId: userId, usedAt: { not: null } } }).catch(() => 0),
    prisma.commission.count({ where: { ambassador: { userId }, sourceType: { in: ["subscription", "premium", "lead-unlock", "lead"] } } }).catch(() => 0),
    prisma.referralReward.findMany({ where: { userId } }).catch(() => []),
  ]);

  const newRewards: { rewardType: string; value: string }[] = [];
  if (activated >= 1 && !activeRewards.some((r) => r.rewardType === "badge" && r.value === "Starter Referrer")) {
    newRewards.push({ rewardType: "badge", value: "Starter Referrer" });
  }
  if (activated >= 3 && !activeRewards.some((r) => r.rewardType === "premium-days" && r.value === "7")) {
    newRewards.push({ rewardType: "premium-days", value: "7" });
  }
  if (paid >= 5 && !activeRewards.some((r) => r.rewardType === "badge" && r.value === "Growth Ambassador")) {
    newRewards.push({ rewardType: "badge", value: "Growth Ambassador" });
  }
  if (paid >= 10 && !activeRewards.some((r) => r.rewardType === "credits" && r.value === "1000")) {
    newRewards.push({ rewardType: "credits", value: "1000" });
  }

  for (const reward of newRewards) {
    await prisma.referralReward.create({ data: { userId, ...reward } }).catch(() => {});
  }

  const level: ReferralLevel = paid >= 10 ? "Elite Partner" : paid >= 5 ? "Ambassador" : activated >= 3 ? "Connector" : "Starter";
  return { activated, paid, rewards: [...activeRewards, ...newRewards], level };
}

export async function getReferralAnalytics(userId: string) {
  const [clicks, signups, activated, paid, rewards] = await Promise.all([
    prisma.referralEvent.count({ where: { code: { in: await getUserReferralCodes(userId) }, eventType: "click" } }).catch(() => 0),
    prisma.referralEvent.count({ where: { code: { in: await getUserReferralCodes(userId) }, eventType: "signup" } }).catch(() => 0),
    prisma.referralEvent.count({ where: { code: { in: await getUserReferralCodes(userId) }, eventType: "activated" } }).catch(() => 0),
    prisma.referralEvent.count({ where: { code: { in: await getUserReferralCodes(userId) }, eventType: "paid" } }).catch(() => 0),
    prisma.referralReward.findMany({ where: { userId } }).catch(() => []),
  ]);
  return { clicks, signups, activated, paid, rewards };
}

async function getUserReferralCodes(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } }).catch(() => null);
  return user?.referralCode ? [user.referralCode] : [];
}
