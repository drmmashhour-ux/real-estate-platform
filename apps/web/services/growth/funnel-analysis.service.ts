/**
 * Ratio-based funnel diagnostics (0–1 rates) — complements %-based KPIs in ads-performance.
 */

export type FunnelMetrics = {
  landingViews: number;
  clicks: number;
  leads: number;
  bookingStarted: number;
  bookingCompleted: number;

  ctr: number;
  clickToLead: number;
  leadToBooking: number;
  completionRate: number;
};

export type FunnelLeakStage = "CTR" | "CLICK_TO_LEAD" | "LEAD_TO_BOOKING" | "COMPLETION";

export type FunnelLeak = {
  stage: FunnelLeakStage;
  value: number;
  benchmarkMin: number;
  severity: "LOW" | "MEDIUM" | "HIGH";
};

/** Minimum acceptable ratios (not %). */
export const FUNNEL_BENCHMARKS = {
  CTR: 0.03,
  CLICK_TO_LEAD: 0.15,
  LEAD_TO_BOOKING: 0.2,
  COMPLETION: 0.7,
} as const;

/** Alias for external docs / dashboards — same values as {@link FUNNEL_BENCHMARKS}. */
export const BENCHMARKS = FUNNEL_BENCHMARKS;

export function computeFunnelMetrics(events: {
  landing_view: number;
  cta_click: number;
  lead_capture: number;
  booking_started: number;
  booking_completed: number;
}): FunnelMetrics {
  const ctr = events.cta_click / Math.max(events.landing_view, 1);
  const clickToLead = events.lead_capture / Math.max(events.cta_click, 1);
  const leadToBooking = events.booking_started / Math.max(events.lead_capture, 1);
  const completionRate = events.booking_completed / Math.max(events.booking_started, 1);

  return {
    landingViews: events.landing_view,
    clicks: events.cta_click,
    leads: events.lead_capture,
    bookingStarted: events.booking_started,
    bookingCompleted: events.booking_completed,
    ctr,
    clickToLead,
    leadToBooking,
    completionRate,
  };
}

function evaluateLeak(
  stage: FunnelLeakStage,
  value: number,
  min: number
): FunnelLeak | null {
  if (value >= min) return null;

  let severity: FunnelLeak["severity"] = "LOW";
  if (value < min * 0.5) severity = "HIGH";
  else if (value < min * 0.8) severity = "MEDIUM";

  return { stage, value, benchmarkMin: min, severity };
}

export function detectFunnelLeaks(metrics: FunnelMetrics): FunnelLeak[] {
  const leaks: FunnelLeak[] = [];
  const push = (x: FunnelLeak | null) => {
    if (x) leaks.push(x);
  };

  push(evaluateLeak("CTR", metrics.ctr, FUNNEL_BENCHMARKS.CTR));
  push(evaluateLeak("CLICK_TO_LEAD", metrics.clickToLead, FUNNEL_BENCHMARKS.CLICK_TO_LEAD));
  push(evaluateLeak("LEAD_TO_BOOKING", metrics.leadToBooking, FUNNEL_BENCHMARKS.LEAD_TO_BOOKING));
  push(evaluateLeak("COMPLETION", metrics.completionRate, FUNNEL_BENCHMARKS.COMPLETION));

  return leaks;
}

/** 0–100 composite health from ratio benchmarks (diagnostic only). */
export function computeHealthScore(m: FunnelMetrics): number {
  let score = 100;

  if (m.ctr < FUNNEL_BENCHMARKS.CTR) score -= 20;
  if (m.clickToLead < FUNNEL_BENCHMARKS.CLICK_TO_LEAD) score -= 20;
  if (m.leadToBooking < FUNNEL_BENCHMARKS.LEAD_TO_BOOKING) score -= 25;
  if (m.completionRate < FUNNEL_BENCHMARKS.COMPLETION) score -= 35;

  return Math.max(score, 0);
}
