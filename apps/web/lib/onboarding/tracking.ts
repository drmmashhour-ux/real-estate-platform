import { prisma } from "@/lib/db";

export async function trackOnboardingMilestone(userId: string, milestoneKey: string, metadata?: object) {
  return prisma.onboardingMilestone.upsert({
    where: { userId_milestoneKey: { userId, milestoneKey } },
    create: { userId, milestoneKey, metadata: metadata as object | undefined },
    update: { metadata: metadata as object | undefined },
  });
}

export async function getOnboardingProgress(userId: string) {
  const milestones = await prisma.onboardingMilestone.findMany({ where: { userId }, orderBy: { completedAt: "asc" } }).catch(() => []);
  const keys = new Set(milestones.map((m) => m.milestoneKey));
  const steps = ["profile_completed", "first_listing_viewed", "first_favorite", "first_lead_sent", "first_payment"];
  const done = steps.filter((s) => keys.has(s)).length;
  return { milestones, done, total: steps.length, percent: Math.round((done / steps.length) * 100) };
}
