import type { RevenueAutopilotMode, RevenueAutopilotScopeType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { REVENUE_PLATFORM_SCOPE_ID } from "./constants";

export async function getOrCreateRevenueAutopilotSettings(
  scopeType: RevenueAutopilotScopeType,
  scopeId: string
) {
  return prisma.revenueAutopilotSetting.upsert({
    where: {
      scopeType_scopeId: { scopeType, scopeId },
    },
    create: { scopeType, scopeId },
    update: {},
  });
}

export async function getOrCreatePlatformRevenueSettings() {
  return getOrCreateRevenueAutopilotSettings("platform", REVENUE_PLATFORM_SCOPE_ID);
}

export async function updateRevenueAutopilotSettings(
  scopeType: RevenueAutopilotScopeType,
  scopeId: string,
  data: Partial<{
    mode: RevenueAutopilotMode;
    autoPromoteTopListings: boolean;
    autoGenerateRevenueActions: boolean;
    allowPriceRecommendations: boolean;
  }>
) {
  await getOrCreateRevenueAutopilotSettings(scopeType, scopeId);
  return prisma.revenueAutopilotSetting.update({
    where: { scopeType_scopeId: { scopeType, scopeId } },
    data,
  });
}
