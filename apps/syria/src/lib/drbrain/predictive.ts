import type { DrBrainMetrics } from "@/lib/drbrain/metrics";

export type PredictiveSignal = {
  level: "WARNING" | "CRITICAL";
  message: string;
};

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function risingTrend(series: number[]): boolean {
  if (series.length < 6) return false;
  const mid = Math.floor(series.length / 2);
  const early = mean(series.slice(0, mid));
  const late = mean(series.slice(mid));
  return late > early * 1.08 && series.at(-1)! >= series.at(-2)!;
}

function sharplyRising(series: number[]): boolean {
  if (series.length < 6) return false;
  const tail = series.slice(-3);
  const prior = series.slice(-6, -3);
  return mean(tail) > mean(prior) * 1.2 && (tail.at(-1) ?? 0) > (tail[0] ?? 0);
}

/**
 * Lightweight heuristic “early warnings” from hourly metrics — no ML, no external calls.
 */
export function predictUpcomingIssues(metrics: DrBrainMetrics): PredictiveSignal[] {
  const out: PredictiveSignal[] = [];
  const seen = new Set<string>();
  const pa = metrics.paymentAttempts;
  const pb = metrics.blockedPayments;
  const er = metrics.errorRate;
  const an = metrics.anomalyScores;

  function push(level: PredictiveSignal["level"], message: string) {
    if (seen.has(message)) return;
    seen.add(message);
    out.push({ level, message });
  }

  if (pa.length >= 6 && pb.length >= 6 && sharplyRising(pa) && sharplyRising(pb)) {
    push("WARNING", "Payment failure spike likely in next 10–15 minutes");
  }

  if (er.length >= 6 && risingTrend(er)) {
    push("WARNING", "Potential API degradation detected");
  }

  if (an.length >= 6 && risingTrend(an)) {
    const tailAvg = mean(an.slice(-3));
    push(
      tailAvg >= 72 ? "CRITICAL" : "WARNING",
      tailAvg >= 72
        ? "High-risk anomaly escalation expected"
        : "Elevated anomaly trend — monitor blocked payments and audit signals.",
    );
  }

  return out;
}
