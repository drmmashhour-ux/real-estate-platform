import { prisma } from "@/lib/db";

export async function getBrokerGrowthGoals(brokerUserId: string) {
  return prisma.brokerGrowthGoal.findUnique({ where: { brokerUserId } });
}

export async function upsertBrokerGrowthGoals(
  brokerUserId: string,
  input: {
    monthlyLeadTarget?: number | null;
    monthlyClosingTarget?: number | null;
    responseTimeHoursTarget?: number | null;
    listingConversionRateTarget?: number | null;
    followUpDisciplineTarget?: number | null;
  },
) {
  return prisma.brokerGrowthGoal.upsert({
    where: { brokerUserId },
    create: { brokerUserId, ...input },
    update: { ...input },
  });
}
