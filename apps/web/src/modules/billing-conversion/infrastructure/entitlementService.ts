import { prisma } from "@/lib/db";
import type { ConversionFeatureKey, ConversionPlanCode } from "@/src/modules/billing-conversion/domain/billing.enums";

export type EntitlementRow = {
  limitValue: number | null;
  enabled: boolean;
};

export async function getEntitlement(planCode: string, featureKey: ConversionFeatureKey): Promise<EntitlementRow | null> {
  const row = await prisma.lecipmConversionEntitlement.findFirst({
    where: { planCode, featureKey },
  });
  if (!row) return null;
  return { limitValue: row.limitValue, enabled: row.enabled };
}

export async function getAllEntitlementsForPlan(planCode: ConversionPlanCode) {
  return prisma.lecipmConversionEntitlement.findMany({
    where: { planCode },
  });
}
