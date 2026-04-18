/**
 * Money Operating System snapshot — composes existing dashboard + safe extensions.
 */

import { prisma } from "@/lib/db";
import { getMRR } from "@/modules/revenue/application/getMRR";
import { aggregateRevenueInRange, buildRevenueDashboardSummary } from "./revenue-dashboard.service";
import { buildUnifiedSources } from "./revenue-source-health.service";
import { detectTopRevenueLeaks } from "./revenue-leak-detector.service";
import { rankProblems } from "./revenue-priority-engine.service";
import { generateMoneyActions } from "./revenue-action-engine.service";
import { buildAutoSuggestions } from "./auto-suggestions-engine.service";
import { getRevenueTargetBundle, computeTargetProgress } from "./revenue-target-system.service";
import { revenueAutomationFlags } from "@/config/feature-flags";
import type { MoneyInsight, MoneyOperatingSystemSnapshot, UnifiedMoneySource } from "./money-os.types";
import { runRevenueAutomationCycle } from "./revenue-automation-engine.service";
import { isRevenueAutomationKillSwitchActive } from "./revenue-automation-safety";

function startOfUtcDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function addUtcDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

export async function buildMoneyOperatingSystemSnapshot(): Promise<MoneyOperatingSystemSnapshot> {
  const now = new Date();
  const weekStart = addUtcDays(startOfUtcDay(now), -6);
  const prevWeekStart = addUtcDays(weekStart, -7);

  const [summary, priorWeekAgg, priorBookingCompleted] = await Promise.all([
    buildRevenueDashboardSummary(),
    aggregateRevenueInRange(prevWeekStart, weekStart),
    prisma.aiConversionSignal
      .count({
        where: {
          createdAt: { gte: prevWeekStart, lt: weekStart },
          eventType: "booking_completed",
        },
      })
      .catch(() => 0),
  ]);

  const rs = priorWeekAgg.bySource;
  const priorUnified: Record<UnifiedMoneySource, number> = {
    leads: rs.lead_unlock,
    featured: rs.boost + rs.subscription,
    bnhub: rs.booking_fee,
    other: rs.other,
  };

  const sources = buildUnifiedSources(summary, priorUnified);
  const targets = getRevenueTargetBundle();
  const progress = computeTargetProgress(
    summary.revenueToday,
    summary.revenueWeek,
    summary.revenueMonth,
    targets,
  );

  const leaks = detectTopRevenueLeaks(summary, priorWeekAgg.total, priorBookingCompleted);
  const ranked = rankProblems(leaks, summary.alerts);
  const actions = generateMoneyActions(summary, ranked);

  const mrrResult = await getMRR(prisma);

  const urgent = summary.alerts.filter((a) => a.level !== "info");
  const prominent =
    urgent.length > 0 ? urgent : summary.alerts;
  const criticalAlerts = prominent.slice(0, 5).map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
  }));

  const keyInsights: MoneyInsight[] = ranked.slice(0, 5).map((r) => ({ text: r.title }));

  const autoSuggestions = buildAutoSuggestions(summary);

  const brokersN = Math.min(12, Math.max(5, summary.activeBrokers || 7));

  const checklistHints = {
    brokersToContactHint: `Circle ${brokersN} brokers with stalled unlocks or dormant listings.`,
    listingsSupplyHint:
      summary.leadsViewed < 15
        ? "Thin lead views — prioritize new listing intake in priority markets."
        : "Maintain listing freshness where views are concentrated.",
  };

  const snapshot: MoneyOperatingSystemSnapshot = {
    generatedAt: new Date().toISOString(),
    summaryCreatedAt: summary.createdAt,
    weekPositiveRevenueEvents: summary.weekPositiveRevenueEvents,
    mrrCad: mrrResult.mrr,
    mrrSubscriptionCount: mrrResult.activeSubscriptionCount,
    mrrMissingData: mrrResult.subscriptionsMissingMrrCount > 0 && mrrResult.mrr == null,
    targets,
    progress,
    revenueToday: summary.revenueToday,
    revenueWeek: summary.revenueWeek,
    revenueMonth: summary.revenueMonth,
    sources,
    topLeaks: leaks.slice(0, 3),
    rankedProblems: ranked.slice(0, 12),
    actions,
    criticalAlerts,
    keyInsights,
    autoSuggestions,
    checklistHints,
    meta: {
      leadsViewedWeek: summary.leadsViewed,
      leadsUnlockedWeek: summary.leadsUnlocked,
      bookingStartsWeek: summary.bookingStarts,
      bookingCompletedWeek: summary.bookingCompleted,
      bookingCompletionRate: summary.bookingCompletionRate,
      priorBookingCompletedWeek: priorBookingCompleted,
      priorWeekTotalCad: priorWeekAgg.total,
    },
  };

  let automationCycle = undefined as MoneyOperatingSystemSnapshot["automationCycle"];
  if (revenueAutomationFlags.revenueAutomationV1 && !isRevenueAutomationKillSwitchActive()) {
    automationCycle = await runRevenueAutomationCycle({
      mode: "full",
      snapshot,
    });
  }

  return { ...snapshot, automationCycle };
}

