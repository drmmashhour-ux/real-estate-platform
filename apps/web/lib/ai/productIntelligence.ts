import "server-only";

import { getLegacyDB } from "@/lib/db/legacy";
import { sendNotification } from "@/lib/notifications/system";
import { findInactiveUsers } from "@/lib/retention/engine";

const prisma = getLegacyDB();

const INACTIVE_FOR_INSIGHT = 5;
const INACTIVE_FOR_HIGH_RETENTION = 20;
const CONFUSING_FOR_ACTION = 2;
const BUG_OCCURRENCE_WARNING = 3;
const REVENUE_FEE_LOW_THRESHOLD = 50; // same units as `fee` column (float $ or stable unit from ledger)

export type ProductInsight = {
  type: "retention" | "feedback" | "revenue";
  summary: string;
  metric: number;
};

export type ProductAction = {
  id: string;
  priority: "low" | "medium" | "high";
  area: "product" | "growth" | "retention";
  title: string;
  description: string;
  /** Safe recommendation copy — not auto-executed. */
  suggestedAction: string;
};

type FeedbackScan = {
  totalWithMessage: number;
  bugHits: number;
  slowHits: number;
  confusingHits: number;
  sampleMessages: string[];
};

function scanFeedbackMessages(rows: { message: string | null }[]): FeedbackScan {
  let totalWithMessage = 0;
  let bugHits = 0;
  let slowHits = 0;
  let confusingHits = 0;
  const sampleMessages: string[] = [];
  for (const r of rows) {
    if (!r.message || !r.message.trim()) continue;
    totalWithMessage += 1;
    const t = r.message.toLowerCase();
    if (/\bbug(s)?\b|broken|error/i.test(t)) bugHits += 1;
    if (/\bslow\b|lag(gy)?|loading/i.test(t)) slowHits += 1;
    if (/\bconfus(ing|ed)\b|unclear|hard to (find|use)/i.test(t)) confusingHits += 1;
    if (sampleMessages.length < 3) sampleMessages.push(r.message.slice(0, 160));
  }
  return { totalWithMessage, bugHits, slowHits, confusingHits, sampleMessages };
}

async function loadFeedbackBatch(limit = 500) {
  return prisma.userFeedback.findMany({
    where: { message: { not: null } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { message: true },
  });
}

async function loadRevenueTotals() {
  const rows = await prisma.marketplaceRevenueEntry.findMany({ select: { fee: true } });
  const totalFees = rows.reduce((s, r) => s + (Number.isFinite(r.fee) ? r.fee : 0), 0);
  return { rowCount: rows.length, totalFees };
}

async function countRecentEvents(days = 14) {
  const since = new Date(Date.now() - days * 86_400_000);
  return prisma.marketplaceEvent.count({ where: { createdAt: { gte: since } } });
}

/**
 * Product intelligence from retention, feedback, revenue, and activity (Order 57).
 * Recommendations only — no side effects; no bulk messaging.
 */
export async function getProductInsights(): Promise<ProductInsight[]> {
  const [inactive, feedbackRows, revenue] = await Promise.all([
    findInactiveUsers().catch(() => [] as { id: string; email: string }[]),
    loadFeedbackBatch().catch(() => [] as { message: string | null }[]),
    loadRevenueTotals().catch(() => ({ rowCount: 0, totalFees: 0 })),
  ]);

  const scan = scanFeedbackMessages(feedbackRows);
  const out: ProductInsight[] = [];
  const inactiveN = inactive.length;

  if (inactiveN >= INACTIVE_FOR_INSIGHT) {
    out.push({
      type: "retention",
      summary: "High drop-off after signup (inactive beyond 3-day window).",
      metric: inactiveN,
    });
  }

  if (scan.totalWithMessage > 0) {
    if (scan.bugHits >= 1) {
      out.push({
        type: "feedback",
        summary: `Users mention bugs, errors, or broken behavior (${scan.bugHits} mention(s)).`,
        metric: scan.bugHits,
      });
    }
    if (scan.slowHits >= 1) {
      out.push({
        type: "feedback",
        summary: `Performance feedback: slow, lag, or loading issues (${scan.slowHits} mention(s)).`,
        metric: scan.slowHits,
      });
    }
    if (scan.confusingHits >= 1) {
      out.push({
        type: "feedback",
        summary: `UX clarity issues: confusion or unclear flows (${scan.confusingHits} mention(s)).`,
        metric: scan.confusingHits,
      });
    }
    if (scan.bugHits + scan.slowHits + scan.confusingHits === 0) {
      out.push({
        type: "feedback",
        summary: "Feedback volume present — no high-severity keyword clusters in recent text.",
        metric: scan.totalWithMessage,
      });
    }
  } else {
    out.push({ type: "feedback", summary: "No text feedback in database yet (or all empty).", metric: 0 });
  }

  if (revenue.totalFees < REVENUE_FEE_LOW_THRESHOLD && revenue.rowCount < 3) {
    out.push({
      type: "revenue",
      summary: "Low monetization activity (few revenue rows / low total fees in shadow ledger).",
      metric: Math.round(revenue.totalFees * 100) / 100,
    });
  } else {
    out.push({
      type: "revenue",
      summary: "Revenue line activity (sum of `fee` on `marketplace_revenue_entries`).",
      metric: Math.round(revenue.totalFees * 100) / 100,
    });
  }

  if (out.length < 1) {
    out.push({ type: "retention", summary: "Not enough data yet; keep collecting events and signups.", metric: 0 });
  }
  return out;
}

/**
 * Prioritized, suggest-only actions. Nothing here writes to the DB or sends email by itself.
 */
export async function getProductActions(): Promise<ProductAction[]> {
  const [inactive, feedbackRows, revenue, eventCount] = await Promise.all([
    findInactiveUsers().catch(() => [] as { id: string; email: string }[]),
    loadFeedbackBatch().catch(() => [] as { message: string | null }[]),
    loadRevenueTotals().catch(() => ({ rowCount: 0, totalFees: 0 })),
    countRecentEvents(14).catch(() => 0),
  ]);

  const scan = scanFeedbackMessages(feedbackRows);
  const actions: ProductAction[] = [];
  const inactiveN = inactive.length;

  if (inactiveN >= INACTIVE_FOR_HIGH_RETENTION) {
    actions.push({
      id: "pi-retention-reengage",
      priority: "high",
      area: "retention",
      title: "Trigger re-engagement notifications",
      description: `Found ${inactiveN} users inactive for 3+ days. Consider a targeted win-back, not a blast.`,
      suggestedAction: "Run `sendRetentionWeMissYouNudge(userId)` from ops/admin when ready, or a drip campaign. No auto-send in product layer.",
    });
  } else if (inactiveN >= INACTIVE_FOR_INSIGHT) {
    actions.push({
      id: "pi-retention-lighter",
      priority: "medium",
      area: "retention",
      title: "Plan light-touch re-engagement",
      description: `Moderate inactive cohort (${inactiveN}). A/B one email or in-app nudge for a subset first.`,
      suggestedAction: "Segment by last action; use sendRetentionWeMissYouNudge for manual trials only.",
    });
  }

  if (scan.confusingHits >= CONFUSING_FOR_ACTION) {
    actions.push({
      id: "pi-ux-onboarding",
      priority: "high",
      area: "product",
      title: "Improve onboarding UX",
      description: `Multiple “confusing / unclear” signals in feedback (${scan.confusingHits} hits).`,
      suggestedAction: "Run a 5-user usability review on signup → first value; ship copy and flow fixes behind a feature flag.",
    });
  } else if (scan.bugHits >= BUG_OCCURRENCE_WARNING) {
    actions.push({
      id: "pi-qa-issues",
      priority: "high",
      area: "product",
      title: "Triage reported bugs in feedback",
      description: `Bug / error language appears ${scan.bugHits} time(s) in recent feedback text.`,
      suggestedAction: "File tickets from samples; add integration tests for top flows; monitor error rates in staging.",
    });
  }

  if (revenue.totalFees < REVENUE_FEE_LOW_THRESHOLD) {
    actions.push({
      id: "pi-revenue-nudges",
      priority: "medium",
      area: "growth",
      title: "Increase conversion nudges",
      description: "Monetization signals are low — pair pricing experiments with checkout friction review.",
      suggestedAction: "Use conversion nudges and listing pricing recommendations; do not change live take rates here.",
    });
  }

  if (eventCount < 20 && eventCount >= 0) {
    actions.push({
      id: "pi-activity-boost",
      priority: "low",
      area: "growth",
      title: "Boost marketplace event volume",
      description: `Only ${eventCount} marketplace_events in 14d — more traffic helps AI layers learn.`,
      suggestedAction: "Run a small paid test or partner push; keep instrumentation healthy before scaling.",
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: "pi-default",
      priority: "low",
      area: "product",
      title: "Collect more product signals",
      description: "No strong action triggers this week. Keep feedback prompts and event logging on.",
      suggestedAction: "Re-run this view weekly and wire `/demo/live` to surface conversion paths.",
    });
  }

  return actions;
}

/**
 * **Manual / ops only** — sends one in-app notification stub. Not called by the intelligence engine.
 * For retention issues, use from admin after review (Order 57 safety: no auto messaging).
 */
export function sendRetentionWeMissYouNudge(userId: string) {
  sendNotification(
    userId,
    "We miss you on LECIPM — new listings and smarter prices are here. Open the app to see what’s new."
  );
}
