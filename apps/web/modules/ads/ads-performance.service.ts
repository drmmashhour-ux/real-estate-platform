/**
 * Ads performance + scaling signals from `growth_events` — no Stripe/booking mutations.
 */
import {
  computeFunnelMetrics,
  computeHealthScore,
  detectFunnelLeaks,
} from "@/services/growth/funnel-analysis.service";
import { generateFixes } from "@/services/growth/funnel-fix-engine.service";
import { prisma } from "@/lib/db";

const EVENT = {
  landing: "landing_view",
  cta: "cta_click",
  lead: "lead_capture",
  bookingStarted: "booking_started",
  bookingDone: "booking_completed",
} as const;

export type AdsScalingThresholds = {
  /** Minimum CTR % to classify as winner */
  winnerCtrMinPercent: number;
  /** Maximum CPL in major currency units (e.g. CAD) — placeholder when spend unknown */
  winnerCplMax: number;
  /** Minimum conversion (bookings/clicks) % */
  winnerConversionMinPercent: number;
  /** Below this CTR % → loser */
  loserCtrMaxPercent: number;
  /** Above this CPL → loser (when spend & leads known) */
  loserCplMin: number;
};

export const DEFAULT_ADS_SCALING_THRESHOLDS: AdsScalingThresholds = {
  winnerCtrMinPercent: 1.5,
  winnerCplMax: 75,
  winnerConversionMinPercent: 3,
  loserCtrMaxPercent: 1,
  loserCplMin: 120,
};

export type AdsPerformanceSummary = {
  windowDays: number;
  since: string;
  until: string;
  /** Proxy for impressions — `landing_view` counts */
  impressions: number;
  clicks: number;
  leads: number;
  bookingsStarted: number;
  bookingsCompleted: number;
  /** Optional paid spend (major units) — from ops input; default 0 → CPL null */
  estimatedSpend: number;
  ctrPercent: number | null;
  cpl: number | null;
  conversionRatePercent: number | null;
};

export type CampaignAdsMetrics = {
  campaignKey: string;
  impressions: number;
  clicks: number;
  leads: number;
  bookingsCompleted: number;
  estimatedSpend: number;
  ctrPercent: number | null;
  cpl: number | null;
  conversionRatePercent: number | null;
};

function pct(num: number, den: number): number | null {
  if (den <= 0) return null;
  return Math.round((num / den) * 10000) / 100;
}

async function countEvents(eventName: string, since: Date, until: Date): Promise<number> {
  return prisma.growthEvent.count({
    where: { eventName, createdAt: { gte: since, lt: until } },
  });
}

/**
 * Aggregate funnel counts for a date window (UTC).
 */
export async function getAdsPerformanceForWindow(
  since: Date,
  until: Date,
  opts?: { estimatedSpend?: number },
): Promise<Omit<AdsPerformanceSummary, "windowDays">> {
  const [impressions, clicks, leads, bookingsStarted, bookingsCompleted] = await Promise.all([
    countEvents(EVENT.landing, since, until),
    countEvents(EVENT.cta, since, until),
    countEvents(EVENT.lead, since, until),
    countEvents(EVENT.bookingStarted, since, until),
    countEvents(EVENT.bookingDone, since, until),
  ]);
  const spend = opts?.estimatedSpend ?? 0;
  const ctrPercent = pct(clicks, Math.max(1, impressions));
  const cpl = leads > 0 && spend > 0 ? Math.round((spend / leads) * 100) / 100 : null;
  const conversionRatePercent = pct(bookingsCompleted, Math.max(1, clicks));

  return {
    since: since.toISOString(),
    until: until.toISOString(),
    impressions,
    clicks,
    leads,
    bookingsStarted,
    bookingsCompleted,
    estimatedSpend: spend,
    ctrPercent,
    cpl,
    conversionRatePercent,
  };
}

export async function getAdsPerformanceSummary(
  rangeDays: number,
  opts?: { estimatedSpend?: number; offsetDays?: number },
): Promise<AdsPerformanceSummary> {
  const offset = opts?.offsetDays ?? 0;
  const until = new Date(Date.now() - offset * 864e5);
  const since = new Date(until.getTime() - rangeDays * 864e5);
  const base = await getAdsPerformanceForWindow(since, until, { estimatedSpend: opts?.estimatedSpend });
  return { windowDays: rangeDays, ...base };
}

async function countByCampaign(eventName: string, since: Date, until: Date): Promise<Map<string, number>> {
  const rows = await prisma.growthEvent.groupBy({
    by: ["utmCampaign"],
    where: { eventName, createdAt: { gte: since, lt: until } },
    _count: { _all: true },
  });
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = (r.utmCampaign ?? "").trim() || "(unset)";
    m.set(k, (m.get(k) ?? 0) + r._count._all);
  }
  return m;
}

/**
 * Per-UTM-campaign metrics for winner/loser detection (spend unknown → CPL null, thresholds skip CPL).
 */
export async function getAdsPerformanceByCampaign(
  rangeDays: number,
  opts?: { offsetDays?: number; estimatedSpendByCampaign?: Record<string, number> },
): Promise<CampaignAdsMetrics[]> {
  const offset = opts?.offsetDays ?? 0;
  const until = new Date(Date.now() - offset * 864e5);
  const since = new Date(until.getTime() - rangeDays * 864e5);

  const [imp, clk, lead, book] = await Promise.all([
    countByCampaign(EVENT.landing, since, until),
    countByCampaign(EVENT.cta, since, until),
    countByCampaign(EVENT.lead, since, until),
    countByCampaign(EVENT.bookingDone, since, until),
  ]);

  const keys = new Set<string>([...imp.keys(), ...clk.keys(), ...lead.keys(), ...book.keys()]);

  const out: CampaignAdsMetrics[] = [];
  for (const campaignKey of keys) {
    const impressions = imp.get(campaignKey) ?? 0;
    const clicks = clk.get(campaignKey) ?? 0;
    const leads = lead.get(campaignKey) ?? 0;
    const bookingsCompleted = book.get(campaignKey) ?? 0;
    const estimatedSpend = opts?.estimatedSpendByCampaign?.[campaignKey] ?? 0;
    const ctrPercent = pct(clicks, Math.max(1, impressions));
    const cpl = leads > 0 && estimatedSpend > 0 ? Math.round((estimatedSpend / leads) * 100) / 100 : null;
    const conversionRatePercent = pct(bookingsCompleted, Math.max(1, clicks));
    out.push({
      campaignKey,
      impressions,
      clicks,
      leads,
      bookingsCompleted,
      estimatedSpend,
      ctrPercent,
      cpl,
      conversionRatePercent,
    });
  }
  return out.sort((a, b) => b.clicks - a.clicks);
}

export type WinnerLoserResult = {
  winners: CampaignAdsMetrics[];
  losers: CampaignAdsMetrics[];
  neutral: CampaignAdsMetrics[];
};

export function detectWinningCampaigns(
  data: CampaignAdsMetrics[],
  thresholds: AdsScalingThresholds = DEFAULT_ADS_SCALING_THRESHOLDS,
): WinnerLoserResult {
  const winners: CampaignAdsMetrics[] = [];
  const losers: CampaignAdsMetrics[] = [];
  const neutral: CampaignAdsMetrics[] = [];

  for (const row of data) {
    const volume = row.impressions + row.clicks + row.leads + row.bookingsCompleted;
    if (volume === 0) {
      neutral.push(row);
      continue;
    }

    const ctr = row.ctrPercent ?? 0;
    const conv = row.conversionRatePercent ?? 0;
    const cpl = row.cpl;

    const highCpl = cpl != null && cpl >= thresholds.loserCplMin;
    const lowCtr = ctr < thresholds.loserCtrMaxPercent;

    const passesCpl = cpl == null || cpl <= thresholds.winnerCplMax;
    const passesCtr = ctr >= thresholds.winnerCtrMinPercent;
    const passesConv = conv >= thresholds.winnerConversionMinPercent;

    if (lowCtr || highCpl) {
      losers.push(row);
    } else if (passesCtr && passesConv && passesCpl) {
      winners.push(row);
    } else {
      neutral.push(row);
    }
  }

  return { winners, losers, neutral };
}

export type AdsPerformanceAlert = {
  kind:
    | "ctr_drop"
    | "cpl_spike"
    | "conversion_drop"
    | "high_spend_no_leads"
    | "cpl_exceeds_ltv"
    | "profitable_low_traffic";
  message: string;
  severity: "warning" | "critical";
};

/**
 * Compare current window vs previous window of equal length.
 */
export async function computeAdsPerformanceAlerts(
  rangeDays: number,
  opts?: { estimatedSpendCurrent?: number; estimatedSpendPrevious?: number },
): Promise<AdsPerformanceAlert[]> {
  const current = await getAdsPerformanceSummary(rangeDays, { estimatedSpend: opts?.estimatedSpendCurrent });
  const previous = await getAdsPerformanceSummary(rangeDays, {
    estimatedSpend: opts?.estimatedSpendPrevious,
    offsetDays: rangeDays,
  });

  const alerts: AdsPerformanceAlert[] = [];

  if (
    current.ctrPercent != null &&
    previous.ctrPercent != null &&
    current.ctrPercent < previous.ctrPercent * 0.85
  ) {
    alerts.push({
      kind: "ctr_drop",
      message: `CTR dipped vs prior period (${current.ctrPercent}% vs ${previous.ctrPercent}%).`,
      severity: current.ctrPercent < (previous.ctrPercent ?? 0) * 0.7 ? "critical" : "warning",
    });
  }

  if (
    current.cpl != null &&
    previous.cpl != null &&
    previous.cpl > 0 &&
    current.cpl > previous.cpl * 1.25
  ) {
    alerts.push({
      kind: "cpl_spike",
      message: `CPL increased vs prior period (${current.cpl} vs ${previous.cpl}).`,
      severity: current.cpl > previous.cpl * 1.5 ? "critical" : "warning",
    });
  }

  if (
    current.conversionRatePercent != null &&
    previous.conversionRatePercent != null &&
    current.conversionRatePercent < previous.conversionRatePercent * 0.85
  ) {
    alerts.push({
      kind: "conversion_drop",
      message: `Booking conversion vs clicks dropped (${current.conversionRatePercent}% vs ${previous.conversionRatePercent}%).`,
      severity: "warning",
    });
  }

  return alerts;
}

/** Raw funnel counts for autonomous analysis (same names as `growth_events` event keys). */
export type GrowthFunnelEventsInput = {
  landing_view: number;
  cta_click: number;
  lead_capture: number;
  booking_started: number;
  booking_completed: number;
};

export type FullGrowthAnalysis = {
  metrics: ReturnType<typeof computeFunnelMetrics>;
  leaks: ReturnType<typeof detectFunnelLeaks>;
  fixes: ReturnType<typeof generateFixes>;
  healthScore: number;
};

/**
 * Funnel ratios, leak detection, fix copy, and composite health score — diagnostic only (no side effects).
 */
export function getFullGrowthAnalysis(events: GrowthFunnelEventsInput): FullGrowthAnalysis {
  const metrics = computeFunnelMetrics(events);
  const leaks = detectFunnelLeaks(metrics);
  const fixes = generateFixes(leaks);
  const healthScore = computeHealthScore(metrics);
  return { metrics, leaks, fixes, healthScore };
}
