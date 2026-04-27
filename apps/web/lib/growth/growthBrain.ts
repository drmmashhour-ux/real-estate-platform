import "server-only";

import { getAcquisitionInsights } from "@/lib/growth/acquisitionInsights";
import { getEarlyUserSignals } from "@/lib/growth/earlyUserSignals";
import { flags } from "@/lib/flags";
import { getCampaignOptimizationInsightsForMarketplace } from "@/lib/marketing/campaignOptimizer";
import { getLegacyDB } from "@/lib/db/legacy";
import { getLaunchStatus, isPlatformLaunchRunning } from "@/lib/launch/controller";
import { getLaunchPhaseBand, getResolvedLaunchDayNumber } from "@/lib/launch/progress";
import { query } from "@/lib/sql";

/**
 * Growth intelligence snapshot (Order 50). Recommendations only — no payouts, spend, or outbound messaging.
 */
export type GrowthBrainSummary = {
  earlyUsers: {
    count: number;
    remaining: number;
    isEarlyPhase: boolean;
  };
  referrals: {
    totalReferrals: number;
    topReferrers: { ownerUserId: string; referralCount: number }[];
  };
  campaigns: {
    totalCampaigns: number;
    campaignsToScale: number;
    campaignsToImprove: number;
    campaignsToPause: number;
  };
  conversion: {
    highIntentUsers: number;
    activeSearches: number;
  };
};

export type GrowthBrainAction = {
  id: string;
  priority: "low" | "medium" | "high";
  area: "referrals" | "campaigns" | "early_users" | "conversion" | "acquisition";
  title: string;
  description: string;
  recommendedAction: string;
  safeToAutomate: boolean;
};

const prisma = getLegacyDB();

const CACHE_TTL_MS = 5000;
let cache: { exp: number; data: { summary: GrowthBrainSummary; actions: GrowthBrainAction[] } } | null = null;

async function countReferralsTotal(): Promise<number> {
  try {
    const rows = await query<{ n: string | null }>(
      `SELECT COUNT(*)::text AS n FROM "Referral" WHERE "usedByUserId" IS NOT NULL`
    );
    return Math.max(0, Math.floor(Number.parseInt(rows[0]?.n ?? "0", 10) || 0));
  } catch {
    return 0;
  }
}

async function loadTopReferrers(): Promise<{ ownerUserId: string; referralCount: number }[]> {
  try {
    const rows = await query<{ rid: string | null; c: string | null }>(
      `
      SELECT "referrerId"::text AS rid, COUNT(*)::text AS c
      FROM "Referral"
      WHERE "usedByUserId" IS NOT NULL
      GROUP BY "referrerId"
      ORDER BY COUNT(*) DESC
      LIMIT 5
    `
    );
    return rows
      .filter((r) => r.rid)
      .map((r) => ({
        ownerUserId: r.rid!,
        referralCount: Math.max(0, Math.floor(Number.parseInt(r.c ?? "0", 10) || 0)),
      }));
  } catch {
    return [];
  }
}

async function loadActiveSearchesDistinct14d(): Promise<number> {
  try {
    const rows = await query<{ n: string | null }>(
      `
      SELECT COUNT(DISTINCT "user_id")::text AS n
      FROM "user_events"
      WHERE "event_type"::text = 'SEARCH_PERFORMED'
        AND "created_at" > NOW() - INTERVAL '14 days'
    `
    );
    return Math.max(0, Math.floor(Number.parseInt(rows[0]?.n ?? "0", 10) || 0));
  } catch {
    return 0;
  }
}

async function loadHighIntentDistinct30d(): Promise<number> {
  try {
    const rows = await query<{ n: string | null }>(
      `
      SELECT COUNT(DISTINCT "user_id")::text AS n
      FROM "user_events"
      WHERE "event_type"::text IN ('BOOKING_START', 'CHECKOUT_START', 'PAYMENT_SUCCESS')
        AND "created_at" > NOW() - INTERVAL '30 days'
        AND "user_id" IS NOT NULL
    `
    );
    return Math.max(0, Math.floor(Number.parseInt(rows[0]?.n ?? "0", 10) || 0));
  } catch {
    return 0;
  }
}

async function countSignupsLast7d(): Promise<number> {
  try {
    const since = new Date(Date.now() - 7 * 86_400_000);
    return await prisma.user.count({ where: { createdAt: { gte: since } } });
  } catch {
    return 0;
  }
}

async function computeGrowthBrain(): Promise<{ summary: GrowthBrainSummary; actions: GrowthBrainAction[] }> {
  const [early, campaignInsights, totalReferrals, topReferrers, activeSearches, highIntentUsers, signups7d] =
    await Promise.all([
      getEarlyUserSignals(),
      getCampaignOptimizationInsightsForMarketplace(),
      countReferralsTotal(),
      loadTopReferrers(),
      loadActiveSearchesDistinct14d(),
      loadHighIntentDistinct30d(),
      countSignupsLast7d(),
    ]);

  const campaignsToScale = campaignInsights.filter((x) => x.recommendation === "scale_budget").length;
  const campaignsToImprove = campaignInsights.filter((x) => x.recommendation === "improve_copy").length;
  const campaignsToPause = campaignInsights.filter((x) => x.recommendation === "pause_campaign").length;

  const summary: GrowthBrainSummary = {
    earlyUsers: {
      count: early.count,
      remaining: early.remaining,
      isEarlyPhase: early.isEarlyPhase,
    },
    referrals: {
      totalReferrals,
      topReferrers,
    },
    campaigns: {
      totalCampaigns: campaignInsights.length,
      campaignsToScale,
      campaignsToImprove,
      campaignsToPause,
    },
    conversion: {
      highIntentUsers: highIntentUsers,
      activeSearches,
    },
  };

  const actions: GrowthBrainAction[] = [];

  if (early.remaining < 20 && early.isEarlyPhase) {
    actions.push({
      id: "gb-early-urgency",
      priority: "high",
      area: "early_users",
      title: "Boost early access urgency",
      description: `Only ${early.remaining} early spots remain in the configured cap; scarcity messaging can lift conversion if used carefully.`,
      recommendedAction:
        "Rotate early-access copy on landing and signup (ops review first) — no automated outbound messages from this layer.",
      safeToAutomate: true,
    });
  }

  const top = topReferrers[0];
  if (top && top.referralCount > 5) {
    actions.push({
      id: "gb-referral-reward-signal",
      priority: "medium",
      area: "referrals",
      title: "Trigger referral reward eligibility event",
      description: `Leading referrer has ${top.referralCount} attributed signups — review reward policy and fire analytics events; no automatic payout.`,
      recommendedAction:
        "Confirm eligibility in admin, then emit `referral_reward_eligible` / internal credit workflow when ready — do not auto-pay here.",
      safeToAutomate: false,
    });
  }

  if (campaignsToImprove >= 3) {
    actions.push({
      id: "gb-campaign-copy-variants",
      priority: "medium",
      area: "campaigns",
      title: "Generate new ad copy variants",
      description: `${campaignsToImprove} simulated campaigns suggest copy improvement; run variant review in sandbox only.`,
      recommendedAction: "Draft copy variants in simulation, compare CTR before any spend change — no live campaign mutation.",
      safeToAutomate: true,
    });
  }

  if (activeSearches >= 50 && signups7d <= 10) {
    actions.push({
      id: "gb-onboarding-cta",
      priority: "high",
      area: "conversion",
      title: "Improve onboarding CTA",
      description: `Search interest is elevated (${activeSearches} active searchers in 14d) but signups in the last 7d are only ${signups7d}.`,
      recommendedAction:
        "Audit signup friction, trust above the fold, and mobile CTA placement — measure signup_started vs completed.",
      safeToAutomate: false,
    });
  }

  try {
    const acq = await getAcquisitionInsights();
    const first = acq.channels[0];
    if (acq.totalUsers > 0 && first && first.source && first.percentage > 50) {
      actions.push({
        id: "gb-acquisition-double-down",
        priority: "medium",
        area: "acquisition",
        title: `Double down on ${first.source}`,
        description: `One first-touch source accounts for more than half of signups (${first.percentage.toFixed(1)}% · ${first.users} users, ${first.source}).`,
        recommendedAction: `Reinforce \`${first.source}\` in creative and UTM tags; keep \`?src=\` / channel fields normalized to canonical values.`,
        safeToAutomate: false,
      });
    } else {
      const active = acq.channels.filter((c) => c.users > 0);
      const topPct = first?.percentage ?? 0;
      if (acq.totalUsers >= 3 && active.length >= 3 && topPct > 0 && topPct < 50) {
        actions.push({
          id: "gb-acquisition-focus-fragmented",
          priority: "low",
          area: "acquisition",
          title: "Focus acquisition on top-performing channels",
          description: `Signups are split across ${active.length} sources (largest share ${topPct.toFixed(1)}%${first ? `, ${first.source}` : ""}) — no single channel exceeds half of volume.`,
          recommendedAction: "Concentrate tests and content on the top 1–2 sources by **conversion rate**; trim long-tail until a clear leader emerges.",
          safeToAutomate: false,
        });
      }
    }
  } catch (e) {
    console.error("[computeGrowthBrain] getAcquisitionInsights failed", e);
  }

  const prio: Record<GrowthBrainAction["priority"], number> = { high: 0, medium: 1, low: 2 };
  actions.sort((a, b) => prio[a.priority] - prio[b.priority]);

  return { summary, actions };
}

/**
 * 7-day launch plan bands (Order 49.1): re-order by phase without mutating the underlying `launchPlan`.
 */
function applyLaunchPlanPrioritization(actions: GrowthBrainAction[], launchPlanDay1To7: number): GrowthBrainAction[] {
  const band = getLaunchPhaseBand(launchPlanDay1To7);
  const order: Record<GrowthBrainAction["area"], number> =
    band === 1
      ? { early_users: 0, referrals: 1, campaigns: 2, conversion: 3, acquisition: 4 }
      : band === 2
        ? { campaigns: 0, early_users: 1, conversion: 2, referrals: 3, acquisition: 4 }
        : { conversion: 0, early_users: 1, campaigns: 2, referrals: 3, acquisition: 4 };
  const prio: Record<"low" | "medium" | "high", number> = { high: 0, medium: 1, low: 2 };
  return [...actions].sort((a, b) => {
    const oa = order[a.area] ?? 9;
    const ob = order[b.area] ?? 9;
    if (oa !== ob) return oa - ob;
    return prio[a.priority] - prio[b.priority];
  });
}

/**
 * When platform one-click launch is running: **priority** (high first), then 7-day area band. No spend / no mutations.
 */
function applyLaunchModeActionOrder(
  actions: GrowthBrainAction[],
  launchPlanDay1To7: number
): GrowthBrainAction[] {
  const band = getLaunchPhaseBand(launchPlanDay1To7);
  const order: Record<GrowthBrainAction["area"], number> =
    band === 1
      ? { early_users: 0, referrals: 1, campaigns: 2, conversion: 3, acquisition: 4 }
      : band === 2
        ? { campaigns: 0, early_users: 1, conversion: 2, referrals: 3, acquisition: 4 }
        : { conversion: 0, early_users: 1, campaigns: 2, referrals: 3, acquisition: 4 };
  const prio: Record<"low" | "medium" | "high", number> = { high: 0, medium: 1, low: 2 };
  return [...actions].sort((a, b) => {
    const p = prio[a.priority] - prio[b.priority];
    if (p !== 0) return p;
    return (order[a.area] ?? 9) - (order[b.area] ?? 9);
  });
}

async function getCached(): Promise<{ summary: GrowthBrainSummary; actions: GrowthBrainAction[] } | null> {
  if (!flags.AUTONOMOUS_AGENT) return null;
  const now = Date.now();
  if (cache && now < cache.exp) return cache.data;
  const data = await computeGrowthBrain();
  cache = { exp: now + CACHE_TTL_MS, data };
  return data;
}

export async function getGrowthBrainSummary(): Promise<GrowthBrainSummary | null> {
  const d = await getCached();
  return d?.summary ?? null;
}

/**
 * @param userId — when set, actions are re-ranked by 7-day launch plan phase, unless **platform one-click launch** is
 * running; then priority-first order + org-wide launch day (Order 50).
 */
export async function getGrowthBrainActions(userId?: string | null): Promise<GrowthBrainAction[]> {
  if (!flags.AUTONOMOUS_AGENT) return [];
  const launch = await isPlatformLaunchRunning();
  const platform = launch ? await getLaunchStatus() : null;
  const planDay = platform?.status === "running" && platform.startedAt ? platform.currentDay : null;

  if (userId) {
    const { actions: raw } = await computeGrowthBrain();
    if (launch && planDay) {
      return applyLaunchModeActionOrder(raw, planDay);
    }
    let day = 1;
    try {
      day = await getResolvedLaunchDayNumber(userId);
    } catch {
      day = 1;
    }
    return applyLaunchPlanPrioritization(raw, day);
  }

  if (launch && planDay) {
    const { actions: raw } = await computeGrowthBrain();
    return applyLaunchModeActionOrder(raw, planDay);
  }

  const d = await getCached();
  return d?.actions ?? [];
}
