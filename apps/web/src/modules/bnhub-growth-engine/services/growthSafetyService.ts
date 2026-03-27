import { BnhubGrowthAutonomyLevel } from "@prisma/client";
import { prisma } from "@/lib/db";

const AUTONOMY_RANK: Record<BnhubGrowthAutonomyLevel, number> = {
  OFF: 0,
  ASSISTED: 1,
  SUPERVISED_AUTOPILOT: 2,
  FULL_AUTOPILOT: 3,
};

function parseIntEnv(key: string, defaultVal: number): number {
  const v = process.env[key];
  if (v == null || v === "") return defaultVal;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : defaultVal;
}

/** Platform default max aggregate daily budget (sum of `budgetDailyCents` on ACTIVE campaigns per host). Null = disabled. */
export function getDefaultDailySpendCapCents(): number | null {
  const v = parseIntEnv("BNHUB_GROWTH_DEFAULT_DAILY_SPEND_CAP_CENTS", 0);
  return v > 0 ? v : null;
}

export function getCampaignLaunchCooldownMinutes(): number {
  return Math.max(0, parseIntEnv("BNHUB_GROWTH_LAUNCH_COOLDOWN_MINUTES", 360));
}

export function getMaxPublishAttempts(): number {
  return Math.max(1, parseIntEnv("BNHUB_GROWTH_PUBLISH_MAX_ATTEMPTS", 5));
}

export function getPublishLockBaseSeconds(): number {
  return Math.max(30, parseIntEnv("BNHUB_GROWTH_PUBLISH_LOCK_BASE_SECONDS", 60));
}

export async function getHostMaxAutonomy(hostUserId: string): Promise<BnhubGrowthAutonomyLevel> {
  const prefs = await prisma.bnhubHostGrowthPrefs.findUnique({ where: { userId: hostUserId } });
  return prefs?.maxAutonomyLevel ?? BnhubGrowthAutonomyLevel.ASSISTED;
}

export async function assertAutonomyAllowedForHost(
  hostUserId: string,
  requested: BnhubGrowthAutonomyLevel
): Promise<void> {
  const max = await getHostMaxAutonomy(hostUserId);
  if (AUTONOMY_RANK[requested] > AUTONOMY_RANK[max]) {
    throw new Error(
      `Autonomy ${requested} exceeds the cap for this host (${max}). Contact support to raise your autopilot tier.`
    );
  }
}

export async function assertNoSiblingActiveCampaign(listingId: string, campaignId: string): Promise<void> {
  const sibling = await prisma.bnhubGrowthCampaign.findFirst({
    where: {
      listingId,
      id: { not: campaignId },
      status: { in: ["ACTIVE", "READY", "SCHEDULED", "AWAITING_APPROVAL"] },
    },
    select: { id: true, campaignName: true },
  });
  if (sibling) {
    throw new Error(
      `Another campaign is already in flight for this listing (“${sibling.campaignName}”). Pause or archive it before launching.`
    );
  }
}

export async function assertListingLaunchCooldown(listingId: string): Promise<void> {
  const minutes = getCampaignLaunchCooldownMinutes();
  if (minutes <= 0) return;
  const since = new Date(Date.now() - minutes * 60_000);
  const recent = await prisma.bnhubGrowthAuditLog.findFirst({
    where: {
      entityType: "bnhub_listing",
      entityId: listingId,
      actionType: "growth_campaign_launched",
      createdAt: { gte: since },
    },
    select: { id: true },
  });
  if (recent) {
    throw new Error(
      `Launch cooldown: at most one launch per listing every ${minutes} minutes. Try again when the window elapses.`
    );
  }
}

/**
 * Sum of daily budgets for this host’s ACTIVE campaigns, plus the campaign being activated if it is not already ACTIVE.
 */
export async function assertHostDailyBudgetHeadroom(params: {
  hostUserId: string;
  activatingCampaignId: string;
  campaignBudgetDailyCents: number | null;
  wasAlreadyActive: boolean;
}): Promise<void> {
  const cap = getDefaultDailySpendCapCents();
  if (cap == null) return;

  const prefs = await prisma.bnhubHostGrowthPrefs.findUnique({
    where: { userId: params.hostUserId },
    select: { dailySpendCapCents: true },
  });
  const hostOverride = prefs?.dailySpendCapCents;
  const effectiveCap =
    hostOverride != null && hostOverride > 0 ? Math.min(cap, hostOverride) : cap;

  const others = await prisma.bnhubGrowthCampaign.aggregate({
    where: {
      hostUserId: params.hostUserId,
      status: "ACTIVE",
      id: { not: params.activatingCampaignId },
    },
    _sum: { budgetDailyCents: true },
  });
  let committed = others._sum.budgetDailyCents ?? 0;
  if (!params.wasAlreadyActive) {
    committed += params.campaignBudgetDailyCents ?? 0;
  }

  if (committed > effectiveCap) {
    throw new Error(
      `Daily budget cap would be exceeded (committed ~${(committed / 100).toFixed(2)} vs cap ${(effectiveCap / 100).toFixed(2)} per day, currency per campaign). Reduce active campaign daily budgets or ask support to raise your cap.`
    );
  }
}
