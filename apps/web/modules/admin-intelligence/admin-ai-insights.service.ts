import type { AdminDashboardSummaryData, RevenueDashboardData } from "@/modules/dashboard/view-models";
import { aggregateLecipmMonetizationMetrics } from "@/modules/revenue/revenue-aggregation.service";
import { getRevenueDashboardData } from "@/modules/dashboard/services/revenue-dashboard.service";
import { getAdminDashboardSummaryData } from "@/modules/dashboard/services/admin-dashboard.service";

import type { AiInsightVm } from "./admin-intelligence.types";

function insight(
  id: string,
  title: string,
  body: string,
  tone: AiInsightVm["tone"],
  priority: number,
): AiInsightVm {
  return { id, title, body, tone, priority };
}

export type AdminAiInsightsContext = {
  rev: RevenueDashboardData;
  summary: AdminDashboardSummaryData;
  agg: Awaited<ReturnType<typeof aggregateLecipmMonetizationMetrics>>;
};

/**
 * Deterministic “AI” narratives from live aggregates — replace with LLM summarization later if desired.
 */
export function buildAdminAiInsights(ctx: AdminAiInsightsContext): AiInsightVm[] {
  const { rev, summary, agg } = ctx;

  const out: AiInsightVm[] = [];

  const top = rev.revenueByHub[0];
  if (top && top.amountCents > 0) {
    const delta =
      top.deltaPctVsPriorDay != null ? `${top.deltaPctVsPriorDay > 0 ? "+" : ""}${top.deltaPctVsPriorDay}% vs yesterday` : "steady";
    out.push(
      insight(
        "top-hub",
        `${top.hubLabel} leads platform share today`,
        `${top.hubLabel} generated ${(top.amountCents / 100).toLocaleString("en-CA", { maximumFractionDigits: 0 })} CAD platform share (${delta}).`,
        top.deltaPctVsPriorDay != null && top.deltaPctVsPriorDay >= 10 ? "positive" : "neutral",
        90,
      ),
    );
  }

  if (rev.todayRevenueCents >= rev.sevenDayAverageCents && rev.sevenDayAverageCents > 0) {
    out.push(
      insight(
        "rev-vs-avg",
        "Platform share at or above the 7-day roll",
        `Today ${(rev.todayRevenueCents / 100).toFixed(0)} CAD vs 7-day avg ${(rev.sevenDayAverageCents / 100).toFixed(0)} CAD.`,
        "positive",
        70,
      ),
    );
  } else if (rev.sevenDayAverageCents > 0) {
    out.push(
      insight(
        "rev-soft",
        "Platform share softer than weekly baseline",
        `Consider campaigns or host incentives — today is below the rolling average.`,
        "warning",
        75,
      ),
    );
  }

  const mrr = agg.mrrCentsApprox / 100;
  if (mrr > 0) {
    out.push(
      insight(
        "mrr",
        "Recurring subscription mirror",
        `Approximate MRR from mirrored Stripe subscriptions ~ ${mrr.toLocaleString("en-CA", { maximumFractionDigits: 0 })} CAD (${agg.activeWorkspaceSubscriptions + agg.activeBrokerSaaSSubscriptions} active seats).`,
        "neutral",
        55,
      ),
    );
  }

  if (summary.leadsToday > summary.bookingsToday + 5) {
    out.push(
      insight(
        "lead-rich",
        "Lead intake outpacing bookings today",
        `${summary.leadsToday} new leads vs ${summary.bookingsToday} bookings — CRM follow-up throughput may be the bottleneck.`,
        "neutral",
        60,
      ),
    );
  }

  const fastest = [...rev.revenueByHub].sort((a, b) => (b.deltaPctVsPriorDay ?? -999) - (a.deltaPctVsPriorDay ?? -999))[0];
  if (fastest && fastest.deltaPctVsPriorDay != null && fastest.deltaPctVsPriorDay >= 15 && fastest.amountCents > 0) {
    out.push(
      insight(
        "fast-segment",
        "Fastest-moving hub vs yesterday",
        `${fastest.hubLabel} platform share accelerated (${fastest.deltaPctVsPriorDay}% change).`,
        "positive",
        78,
      ),
    );
  }

  out.sort((a, b) => b.priority - a.priority);
  return out.slice(0, 8);
}

/** Standalone fetch (e.g. tests / isolated APIs). */
export async function generateAdminAiInsights(): Promise<AiInsightVm[]> {
  const [rev, summary, agg] = await Promise.all([
    getRevenueDashboardData(),
    getAdminDashboardSummaryData(),
    aggregateLecipmMonetizationMetrics(30),
  ]);
  return buildAdminAiInsights({ rev, summary, agg });
}
