import { countDrBrainApiLikeSignals24h, getDrBrainMetrics } from "@/lib/drbrain/metrics";

const HOUR_MS = 60 * 60 * 1000;

export type DrBrainSyriaHourlyPoint = {
  hourLabel: string;
  attempts: number;
  blocked: number;
  anomalyScore: number;
  apiErrorRatePct: number;
};

export type DrBrainSyriaChartsPayload = {
  hourly24h: DrBrainSyriaHourlyPoint[];
  payoutDistribution: { name: string; value: number }[];
  totals24h: { attempts: number; blocked: number; apiLikeErrors: number };
};

/**
 * Legacy adapter — delegates to {@link getDrBrainMetrics} so charts + CLI stay aligned.
 */
export async function getDrBrainSyriaChartsPayload(): Promise<DrBrainSyriaChartsPayload> {
  const [m, apiLikeErrors] = await Promise.all([getDrBrainMetrics(), countDrBrainApiLikeSignals24h()]);

  const hourly24h: DrBrainSyriaHourlyPoint[] = m.timestamps.map((ts, i) => ({
    hourLabel: `${new Date(ts).getUTCHours().toString().padStart(2, "0")}:00`,
    attempts: m.paymentAttempts[i] ?? 0,
    blocked: m.blockedPayments[i] ?? 0,
    anomalyScore: m.anomalyScores[i] ?? 0,
    apiErrorRatePct: m.errorRate[i] ?? 0,
  }));

  const totals24h = {
    attempts: m.paymentAttempts.reduce((a, b) => a + b, 0),
    blocked: m.blockedPayments.reduce((a, b) => a + b, 0),
    apiLikeErrors,
  };

  return {
    hourly24h,
    payoutDistribution: [
      { name: "HELD", value: m.payouts.held },
      { name: "ELIGIBLE", value: m.payouts.eligible },
      { name: "RELEASED", value: m.payouts.released },
      { name: "BLOCKED", value: m.payouts.blocked },
    ],
    totals24h,
  };
}

/** @internal Used when aligning hourly sums with rolling windows */
export { HOUR_MS };
