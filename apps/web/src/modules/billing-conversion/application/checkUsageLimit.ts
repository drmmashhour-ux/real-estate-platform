import { prisma } from "@/lib/db";
import type { ConversionFeatureKey } from "@/src/modules/billing-conversion/domain/billing.enums";
import type { UsageLimitCheckResult } from "@/src/modules/billing-conversion/domain/billing.types";
import { getEntitlement } from "@/src/modules/billing-conversion/infrastructure/entitlementService";
import { currentUsagePeriodKey, getOrCreateUsageForPeriod } from "@/src/modules/billing-conversion/infrastructure/usageRepository";
import { getUserPlan } from "@/src/modules/billing-conversion/application/getUserPlan";

function usageCount(
  row: { simulationsUsed: number; draftsUsed: number; negotiationDraftsUsed: number; scenarioSavesUsed: number },
  feature: ConversionFeatureKey
): number {
  switch (feature) {
    case "simulations":
      return row.simulationsUsed;
    case "ai_drafting":
      return row.draftsUsed;
    case "negotiation_drafts":
      return row.negotiationDraftsUsed;
    case "scenario_history":
      return row.scenarioSavesUsed;
    default:
      return 0;
  }
}

export async function checkUsageLimit(userId: string, feature: ConversionFeatureKey): Promise<UsageLimitCheckResult> {
  const { planCode } = await getUserPlan(userId);
  const ent = await getEntitlement(planCode, feature);

  if (!ent) {
    return {
      allowed: true,
      remaining: null,
      limitReached: false,
      currentPlan: planCode,
      upgradeRequired: false,
      limit: null,
      feature,
    };
  }

  if (!ent.enabled) {
    return {
      allowed: false,
      remaining: 0,
      limitReached: true,
      currentPlan: planCode,
      upgradeRequired: true,
      limit: 0,
      feature,
    };
  }

  if (ent.limitValue == null) {
    return {
      allowed: true,
      remaining: null,
      limitReached: false,
      currentPlan: planCode,
      upgradeRequired: false,
      limit: null,
      feature,
    };
  }

  const periodKey = currentUsagePeriodKey();
  const row = await getOrCreateUsageForPeriod(userId, periodKey);
  const used = usageCount(row, feature);
  const limit = ent.limitValue;
  const remaining = Math.max(0, limit - used);
  const allowed = used < limit;

  return {
    allowed,
    remaining,
    limitReached: !allowed,
    currentPlan: planCode,
    upgradeRequired: !allowed,
    limit,
    feature,
  };
}

/** Safe fallback if conversion tables are empty (migration not applied). */
export async function checkUsageLimitWithFallback(userId: string, feature: ConversionFeatureKey): Promise<UsageLimitCheckResult> {
  try {
    const count = await prisma.lecipmConversionEntitlement.count();
    if (count === 0) {
      return {
        allowed: true,
        remaining: null,
        limitReached: false,
        currentPlan: "free",
        upgradeRequired: false,
        limit: null,
        feature,
      };
    }
    return checkUsageLimit(userId, feature);
  } catch {
    return {
      allowed: true,
      remaining: null,
      limitReached: false,
      currentPlan: "free",
      upgradeRequired: false,
      limit: null,
      feature,
    };
  }
}
