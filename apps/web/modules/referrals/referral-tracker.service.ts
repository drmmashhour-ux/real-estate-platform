import { prisma } from "@/lib/db";
import { subDays } from "date-fns";

export async function referralActivitySince(since: Date) {
  const [referrals, events, rewards] = await Promise.all([
    prisma.referral.count({ where: { createdAt: { gte: since } } }),
    prisma.referralEvent.count({ where: { createdAt: { gte: since } } }),
    prisma.referralReward.count({ where: { createdAt: { gte: since } } }),
  ]);
  return { referrals, events, rewards };
}

export async function recentReferralEvents(limit = 50) {
  return prisma.referralEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, code: true, eventType: true, createdAt: true },
  });
}

export function defaultWindowDays() {
  return 90;
}

export async function snapshotReferralEngine(windowDays = 90) {
  const since = subDays(new Date(), windowDays);
  const activity = await referralActivitySince(since);
  const recent = await recentReferralEvents(30);
  return { since: since.toISOString(), activity, recent };
}
