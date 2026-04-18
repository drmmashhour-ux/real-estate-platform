import { prisma } from "@/lib/db";

export type OnboardingOptimizerReport = {
  generatedAt: string;
  usersWithMilestones: number;
  milestoneCoverage: { milestoneKey: string; userCount: number }[];
  gaps: string[];
  disclaimers: string[];
};

/**
 * Surfaces milestone coverage from `OnboardingMilestone` — no fabricated completion rates.
 */
export async function buildOnboardingOptimizerReport(): Promise<OnboardingOptimizerReport> {
  const grouped = await prisma.onboardingMilestone.groupBy({
    by: ["milestoneKey"],
    _count: { userId: true },
  });

  const usersWithMilestones = await prisma.onboardingMilestone.findMany({
    distinct: ["userId"],
    select: { userId: true },
  });

  const totalUsers = await prisma.user.count();
  const milestoneCoverage = [...grouped]
    .sort((a, b) => b._count.userId - a._count.userId)
    .map((g) => ({
      milestoneKey: g.milestoneKey,
      userCount: g._count.userId,
    }));

  const gaps: string[] = [];
  if (usersWithMilestones.length < totalUsers * 0.05 && totalUsers > 50) {
    gaps.push("Few users have recorded onboarding milestones — instrument key steps or backfill from product events.");
  }
  if (!grouped.some((g) => g.milestoneKey.includes("LISTING"))) {
    gaps.push("No FIRST_LISTING-style milestones in DB — host activation may be under-tracked.");
  }

  return {
    generatedAt: new Date().toISOString(),
    usersWithMilestones: usersWithMilestones.length,
    milestoneCoverage,
    gaps,
    disclaimers: [
      "Milestones are only as complete as product instrumentation writes to `OnboardingMilestone`.",
    ],
  };
}
