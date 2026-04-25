/**
 * Scores market leadership from measurable inputs only. Output is a diagnostic score, not a category rank claim.
 */

import type { LeadershipMetrics } from "./leadership-metrics.types";

const WEIGHTS = {
  activeBrokers: 0.28,
  dealsProcessed: 0.24,
  engagementRate: 0.22,
  revenue: 0.26,
} as const;

/** Internal calibration — tune from historical baselines; not public promises */
const PLACEHOLDER_ASPIRATION = {
  /** Rough targets for a full score in primary market (operator-tuned) */
  activeBrokers: 200,
  dealsProcessed: 80,
  engagementRate: 0.5,
  revenueCents: 2_000_000_00,
};

function clamp01(n: number): number {
  if (Number.isNaN(n) || n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export type LeadershipGap = {
  id: string;
  severity: "low" | "medium" | "high";
  message: string;
};

export type LeadershipEvaluation = {
  /** 0–100 composite; interpret with gaps, not as external “rank” */
  leadershipScore: number;
  /** Where to invest next, ordered by impact */
  gaps: LeadershipGap[];
  /** Component contributions 0–100 (pre-weight) for transparency */
  components: {
    activeBrokers: number;
    dealsProcessed: number;
    engagementRate: number;
    revenue: number;
  };
};

/**
 * @param metrics - measured values from `fetchLeadershipMetrics` (or tests)
 */
export function evaluateLeadership(metrics: LeadershipMetrics): LeadershipEvaluation {
  const a = PLACEHOLDER_ASPIRATION;
  const c = {
    activeBrokers: clamp01(metrics.activeBrokers / a.activeBrokers) * 100,
    dealsProcessed: clamp01(metrics.dealsProcessed / a.dealsProcessed) * 100,
    engagementRate: clamp01(metrics.engagementRate / a.engagementRate) * 100,
    revenue: clamp01(metrics.revenueCents / a.revenueCents) * 100,
  };

  const leadershipScore = Math.round(
    c.activeBrokers * WEIGHTS.activeBrokers +
      c.dealsProcessed * WEIGHTS.dealsProcessed +
      c.engagementRate * WEIGHTS.engagementRate +
      c.revenue * WEIGHTS.revenue
  );

  const gaps: LeadershipGap[] = [];

  if (c.activeBrokers < 55) {
    gaps.push({
      id: "brokers",
      severity: c.activeBrokers < 30 ? "high" : "medium",
      message:
        "Broker base in primary market is below trajectory — prioritize onboarding, enablement, and partner-led acquisition.",
    });
  }
  if (c.dealsProcessed < 50) {
    gaps.push({
      id: "deals",
      severity: c.dealsProcessed < 25 ? "high" : "medium",
      message: "Transaction volume is the proof point — tighten pipeline execution and LECIPM deal tooling adoption.",
    });
  }
  if (c.engagementRate < 45) {
    gaps.push({
      id: "engagement",
      severity: "medium",
      message:
        "Engagement lags target — run targeted enablement, in-app prompts, and success touchpoints for active brokers.",
    });
  }
  if (c.revenue < 40) {
    gaps.push({
      id: "revenue",
      severity: c.revenue < 20 ? "high" : "low",
      message: "Revenue per segment is not yet at aspiration — review pricing, attach, and collection with finance.",
    });
  }

  if (gaps.length === 0) {
    gaps.push({
      id: "sustain",
      severity: "low",
      message:
        "Composition looks balanced — sustain motion and document playbooks before expanding beyond the primary segment.",
    });
  }

  return { leadershipScore, gaps, components: c };
}
