import { GrowthEmailQueueStatus, UserEventType } from "@prisma/client";
import { subDays } from "date-fns";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { getBestChannels } from "@/src/modules/ai/growthEngine";
import type { OpsIssue } from "@/src/modules/ai/opsMonitor";
import type { ScalingHint } from "@/src/modules/ai/growthDirector";

export type CeoActionType =
  | "increase_seo"
  | "daily_social_post"
  | "send_marketing_emails"
  | "boost_listings"
  | "reassign_leads"
  | "scale_channel_spend"
  | "run_crm_sweep"
  | "revenue_upsell_nudge"
  | "drain_email_queue";

export type CeoAction = {
  id: string;
  type: CeoActionType;
  priority: number;
  rationale: string;
  payload?: Record<string, unknown>;
};

export type CeoMetricsSnapshot = {
  leadsLast7d: number;
  leadsPrev7d: number;
  leadDeltaPct: number;
  listingViews7d: number;
  paymentsSuccess7d: number;
  paymentFailed24h: number;
  topChannels: { channel: string; leads: number }[];
  failedEmails24h: number;
  failedSocialPosts24h: number;
  hotScoredUsers: number;
  freeHotUsers: number;
  stripeWebhookLogs7d: number;
};

function pctDelta(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/**
 * Pull cross-functional metrics for autonomous CEO decisions (DB-backed heuristics).
 */
export async function analyzeMetrics(): Promise<CeoMetricsSnapshot> {
  const now = new Date();
  const d1 = subDays(now, 1);
  const d7 = subDays(now, 7);
  const d14 = subDays(now, 14);

  const ext = prisma as unknown as {
    socialScheduledPost?: { count: (args: object) => Promise<number> };
    userScore?: { count: (args: object) => Promise<number> };
  };

  const [
    leadsLast7d,
    leadsPrev7d,
    listingViews7d,
    paymentsSuccess7d,
    paymentFailed24h,
    topChannels,
    failedEmails24h,
    failedSocialPosts24h,
    hotScoredUsers,
    freeHotUsers,
    stripeWebhookLogs7d,
  ] = await Promise.all([
    prisma.lead.count({ where: { createdAt: { gte: d7 } } }),
    prisma.lead.count({ where: { createdAt: { gte: d14, lt: d7 } } }),
    prisma.userEvent.count({
      where: { eventType: UserEventType.LISTING_VIEW, createdAt: { gte: d7 } },
    }),
    prisma.userEvent.count({
      where: { eventType: UserEventType.PAYMENT_SUCCESS, createdAt: { gte: d7 } },
    }),
    prisma.userEvent.count({
      where: { eventType: UserEventType.PAYMENT_FAILED, createdAt: { gte: d1 } },
    }),
    getBestChannels(30, 8),
    prisma.growthEmailQueue.count({
      where: { status: GrowthEmailQueueStatus.FAILED, createdAt: { gte: d1 } },
    }),
    ext.socialScheduledPost
      ? ext.socialScheduledPost.count({
          where: { status: "failed", createdAt: { gte: d1 } },
        })
      : Promise.resolve(0),
    ext.userScore ? ext.userScore.count({ where: { intentLevel: "hot" } }) : Promise.resolve(0),
    ext.userScore
      ? ext.userScore.count({
          where: { intentLevel: "hot", user: { plan: "free" } },
        })
      : Promise.resolve(0),
    prisma.growthStripeWebhookLog.count({ where: { createdAt: { gte: d7 } } }),
  ]);

  return {
    leadsLast7d,
    leadsPrev7d,
    leadDeltaPct: pctDelta(leadsLast7d, leadsPrev7d),
    listingViews7d,
    paymentsSuccess7d,
    paymentFailed24h,
    topChannels,
    failedEmails24h,
    failedSocialPosts24h,
    hotScoredUsers,
    freeHotUsers,
    stripeWebhookLogs7d,
  };
}

export type GenerateActionsContext = {
  opsIssues?: OpsIssue[];
  scalingHints?: ScalingHint[];
};

/**
 * Rule-based action planner from metrics + ops + growth director hints.
 */
export function generateActions(metrics: CeoMetricsSnapshot, ctx: GenerateActionsContext = {}): CeoAction[] {
  const actions: CeoAction[] = [];
  const criticalOps = ctx.opsIssues?.filter((o) => o.severity === "critical") ?? [];

  if (criticalOps.length > 0) {
    actions.push({
      id: randomUUID(),
      type: "drain_email_queue",
      priority: 100,
      rationale: "Critical ops alert — drain growth email queue and retry pipeline",
      payload: { codes: criticalOps.map((c) => c.code) },
    });
  }

  if (metrics.leadDeltaPct <= -15 || metrics.leadsLast7d < 5) {
    actions.push({
      id: randomUUID(),
      type: "increase_seo",
      priority: 88,
      rationale: `Lead flow weak (Δ ${metrics.leadDeltaPct}% vs prior week) — refresh SEO content pack`,
    });
    actions.push({
      id: randomUUID(),
      type: "send_marketing_emails",
      priority: 82,
      rationale: "Push lifecycle emails to recover funnel momentum",
    });
  }

  if (metrics.listingViews7d < 80) {
    actions.push({
      id: randomUUID(),
      type: "boost_listings",
      priority: 75,
      rationale: "Low listing view volume — feature top demand listings",
    });
  }

  actions.push({
    id: randomUUID(),
    type: "daily_social_post",
    priority: 70,
    rationale: "Daily organic post + publish sweep (marketing autopilot)",
  });

  if (metrics.freeHotUsers >= 3) {
    actions.push({
      id: randomUUID(),
      type: "revenue_upsell_nudge",
      priority: 65,
      rationale: `${metrics.freeHotUsers} hot free accounts — premium / pro nudge queue`,
    });
  }

  actions.push({
    id: randomUUID(),
    type: "run_crm_sweep",
    priority: 60,
    rationale: "Recompute scores, assign unassigned leads, queue high-intent follow-ups",
  });

  actions.push({
    id: randomUUID(),
    type: "reassign_leads",
    priority: 55,
    rationale: "Rotate stale broker assignments with no logged follow-up",
  });

  for (const hint of ctx.scalingHints ?? []) {
    if (hint.action !== "hold") {
      actions.push({
        id: randomUUID(),
        type: "scale_channel_spend",
        priority: 50,
        rationale: hint.rationale,
        payload: { channel: hint.channel, suggestedAction: hint.action },
      });
    }
  }

  if (metrics.failedEmails24h >= 3) {
    actions.push({
      id: randomUUID(),
      type: "drain_email_queue",
      priority: 95,
      rationale: `${metrics.failedEmails24h} failed growth emails in 24h — process queue`,
    });
  }

  actions.sort((a, b) => b.priority - a.priority);
  return dedupeActionTypes(actions);
}

function dedupeActionTypes(actions: CeoAction[]): CeoAction[] {
  const seen = new Set<CeoActionType>();
  const out: CeoAction[] = [];
  for (const a of actions) {
    if (a.type === "drain_email_queue" && seen.has("drain_email_queue")) continue;
    if (a.type === "scale_channel_spend" && seen.has("scale_channel_spend")) continue;
    seen.add(a.type);
    out.push(a);
  }
  return out;
}
