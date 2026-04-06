import type { AiDisputeRiskLevel, AiDisputeRiskSignalType, PrismaClient } from "@prisma/client";

const LEVEL_RANK: Record<AiDisputeRiskLevel, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
};

/**
 * Suppress duplicate alerts for the same booking + signal within the cooldown window,
 * unless the new assessment is strictly higher severity than the last log.
 */
export async function shouldSuppressRiskLog(input: {
  prisma: PrismaClient;
  bookingId: string;
  signalType: AiDisputeRiskSignalType;
  newLevel: AiDisputeRiskLevel;
  cooldownHours?: number;
}): Promise<boolean> {
  const hours = input.cooldownHours ?? 24;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const recent = await input.prisma.aiDisputeRiskLog.findFirst({
    where: {
      bookingId: input.bookingId,
      signalType: input.signalType,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    select: { riskLevel: true },
  });
  if (!recent) return false;
  return LEVEL_RANK[input.newLevel] <= LEVEL_RANK[recent.riskLevel];
}
