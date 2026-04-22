import { prisma } from "@/lib/db";

export async function isTenantFeatureEnabled(tenantId: string, featureKey: string) {
  const flag = await prisma.tenantFeatureFlag.findUnique({
    where: { tenantId_featureKey: { tenantId, featureKey } },
  });

  return !!flag?.enabled;
}

export const TENANT_FEATURE_KEYS = [
  "ai_copilot",
  "buy_box",
  "deal_finder",
  "appraisal",
  "executive_command_center",
  "presentation_mode",
  "bnhub",
  "market_watch",
  "alerts",
  "watchlist",
] as const;
