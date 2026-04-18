/**
 * Money Operating System — types only (aggregates compose existing Revenue dashboard).
 */

import type { AutomationCycleResult } from "./revenue-automation.types";

export type UnifiedMoneySource = "leads" | "featured" | "bnhub" | "other";

export type TrendDirection = "up" | "down" | "flat";

export type SourceHealth = "GOOD" | "WEAK" | "CRITICAL";

export type RevenueTargetBundle = {
  dailyTargetCad: number;
  weeklyTargetCad: number;
  monthlyTargetCad: number;
};

export type TargetProgress = {
  dailyPct: number | null;
  weeklyPct: number | null;
  monthlyPct: number | null;
  gapDailyCad: number;
  gapWeeklyCad: number;
  gapMonthlyCad: number;
  gapMessageToday: string;
};

export type MoneySourceRow = {
  key: UnifiedMoneySource;
  label: string;
  amountCad: number;
  pctOfWeekTotal: number;
  trend: TrendDirection;
  health: SourceHealth;
  /** Prior 7d window total for same bucket (CAD). */
  priorWeekCad: number;
};

export type RevenueLeak = {
  id: string;
  title: string;
  detail: string;
  impactScore: number;
};

export type RankedProblem = {
  id: string;
  title: string;
  detail: string;
  impactScore: number;
  kind: "leak" | "alert";
};

export type MoneyAction = {
  id: string;
  text: string;
  rationale: string;
};

export type AutoSuggestion = {
  id: string;
  text: string;
};

export type MoneyInsight = {
  text: string;
};

export type MoneyOperatingSystemSnapshot = {
  generatedAt: string;
  summaryCreatedAt: string;
  /** Positive-amount RevenueEvent rows (7d) — automation + sparse signals */
  weekPositiveRevenueEvents: number;
  /** Workspace subscription MRR when Stripe mrrCents populated; else null + note in UI */
  mrrCad: number | null;
  mrrSubscriptionCount: number;
  mrrMissingData: boolean;
  targets: RevenueTargetBundle;
  progress: TargetProgress;
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  sources: MoneySourceRow[];
  topLeaks: RevenueLeak[];
  rankedProblems: RankedProblem[];
  actions: MoneyAction[];
  criticalAlerts: { id: string; title: string; description: string }[];
  keyInsights: MoneyInsight[];
  autoSuggestions: AutoSuggestion[];
  checklistHints: {
    brokersToContactHint: string;
    listingsSupplyHint: string;
  };
  meta: {
    leadsViewedWeek: number;
    leadsUnlockedWeek: number;
    bookingStartsWeek: number;
    bookingCompletedWeek: number;
    bookingCompletionRate: number;
    priorBookingCompletedWeek: number;
    priorWeekTotalCad: number;
  };
  automationCycle?: AutomationCycleResult;
};
