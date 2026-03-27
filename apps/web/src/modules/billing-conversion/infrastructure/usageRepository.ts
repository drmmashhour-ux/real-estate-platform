import { prisma } from "@/lib/db";
import type { ConversionFeatureKey } from "@/src/modules/billing-conversion/domain/billing.enums";

export function currentUsagePeriodKey(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `monthly_${y}_${m}`;
}

export async function getOrCreateUsageForPeriod(userId: string, periodKey: string) {
  return prisma.lecipmConversionUsage.upsert({
    where: { userId_periodKey: { userId, periodKey } },
    create: {
      userId,
      periodKey,
      simulationsUsed: 0,
      draftsUsed: 0,
      negotiationDraftsUsed: 0,
      scenarioSavesUsed: 0,
    },
    update: {},
  });
}

const INCREMENTABLE: ConversionFeatureKey[] = [
  "simulations",
  "ai_drafting",
  "negotiation_drafts",
  "scenario_history",
];

export async function incrementUsageForFeature(userId: string, feature: ConversionFeatureKey) {
  if (!INCREMENTABLE.includes(feature)) {
    const row = await getOrCreateUsageForPeriod(userId, currentUsagePeriodKey());
    return {
      before: row,
      after: row,
    };
  }

  const periodKey = currentUsagePeriodKey();
  const field =
    feature === "simulations"
      ? "simulationsUsed"
      : feature === "ai_drafting"
        ? "draftsUsed"
        : feature === "negotiation_drafts"
          ? "negotiationDraftsUsed"
          : "scenarioSavesUsed";

  return prisma.$transaction(async (tx) => {
    const beforeRow = await tx.lecipmConversionUsage.findUnique({
      where: { userId_periodKey: { userId, periodKey } },
    });
    const updated = await tx.lecipmConversionUsage.upsert({
      where: { userId_periodKey: { userId, periodKey } },
      create: {
        userId,
        periodKey,
        simulationsUsed: field === "simulationsUsed" ? 1 : 0,
        draftsUsed: field === "draftsUsed" ? 1 : 0,
        negotiationDraftsUsed: field === "negotiationDraftsUsed" ? 1 : 0,
        scenarioSavesUsed: field === "scenarioSavesUsed" ? 1 : 0,
      },
      update: {
        [field]: { increment: 1 },
      },
    });
    return { before: beforeRow, after: updated };
  });
}
