import type { PlatformRole } from "@prisma/client";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { hasUnlimitedGrowthUsage, maxFreeAiDrafts, maxFreeSimulatorRuns } from "@/src/modules/growth-funnel/domain/usageLimits";
import { getOrCreateUsageCounter } from "@/src/modules/growth-funnel/infrastructure/growthFunnelRepository";

export type PaywallKind = "simulator" | "ai_draft";

export async function checkGrowthPaywall(args: {
  userId: string;
  plan: string;
  role: PlatformRole;
  kind: PaywallKind;
}): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  if (args.role === "ADMIN" || (await isPlatformAdmin(args.userId))) {
    return { allowed: true, remaining: 999999, limit: 999999 };
  }
  if (hasUnlimitedGrowthUsage(args.plan)) {
    return { allowed: true, remaining: 999999, limit: 999999 };
  }

  const counter = await getOrCreateUsageCounter(args.userId);
  if (args.kind === "simulator") {
    const limit = maxFreeSimulatorRuns();
    const used = counter.simulatorRuns;
    const remaining = Math.max(0, limit - used);
    return { allowed: remaining > 0, remaining, limit };
  }
  const limit = maxFreeAiDrafts();
  const used = counter.aiDrafts;
  const remaining = Math.max(0, limit - used);
  return { allowed: remaining > 0, remaining, limit };
}
