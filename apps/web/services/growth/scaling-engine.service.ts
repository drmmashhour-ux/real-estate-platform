import { logInfo } from "@/lib/logger";

/** CTR and conversion as 0–1 ratios (not %). */
export type ScalingCampaignInput = {
  ctr: number;
  conversionRate: number;
  cpl: number | null;
  clicks: number;
};

export type ScalingDecision =
  | {
      action: "SCALE_UP";
      increase: number;
      reversible: true;
      note: string;
    }
  | {
      action: "KILL";
      reason: string;
      reversible: true;
      note: string;
    }
  | {
      action: "KEEP";
      reversible: true;
      note: string;
    }
  | {
      action: "HOLD";
      reason: string;
      reversible: true;
      note: string;
    };

const MIN_CLICKS_FOR_KILL = 100;
const MIN_HEALTH_FOR_SCALE = 70;

/**
 * Suggestion-only scaling labels — does not change ad platforms or spend.
 * Safety: no SCALE_UP if healthScore &lt; 70; no KILL if clicks &lt; MIN_CLICKS_FOR_KILL.
 */
export function decideScaling(
  campaign: ScalingCampaignInput,
  opts?: { healthScore?: number; /** Suppress server logs (e.g. dashboard SSR). */ quiet?: boolean }
): ScalingDecision {
  const healthScore = opts?.healthScore ?? 100;
  const quiet = opts?.quiet === true;
  const { ctr, conversionRate, clicks } = campaign;

  const lowPerformance = ctr < 0.02 || conversionRate < 0.03;
  const strongPerformance = ctr > 0.04 && conversionRate > 0.08;

  const slog = (msg: string, meta: Record<string, unknown>) => {
    if (!quiet) logInfo(msg, meta);
  };

  if (lowPerformance) {
    if (clicks < MIN_CLICKS_FOR_KILL) {
      const d: ScalingDecision = {
        action: "HOLD",
        reason: `Insufficient volume for kill rule (clicks ${clicks} < ${MIN_CLICKS_FOR_KILL})`,
        reversible: true,
        note: "Suggestion only — no platform action.",
      };
      slog("[scaling-engine] HOLD (sample size)", { clicks, ctr, conversionRate });
      return d;
    }
    const d: ScalingDecision = {
      action: "KILL",
      reason: "Low performance vs thresholds",
      reversible: true,
      note: "Suggestion only — pause or rework in ad manager manually; reversible by re-enabling.",
    };
    slog("[scaling-engine] KILL suggestion", { clicks, ctr, conversionRate });
    return d;
  }

  if (strongPerformance) {
    if (healthScore < MIN_HEALTH_FOR_SCALE) {
      const d: ScalingDecision = {
        action: "HOLD",
        reason: `Health score ${healthScore} < ${MIN_HEALTH_FOR_SCALE} — scale-up blocked`,
        reversible: true,
        note: "Improve funnel health before increasing spend.",
      };
      slog("[scaling-engine] HOLD (health score)", { healthScore, ctr, conversionRate });
      return d;
    }
    const d: ScalingDecision = {
      action: "SCALE_UP",
      increase: 0.3,
      reversible: true,
      note: "Suggestion only — increase budget gradually in ad manager; reverse by lowering budget.",
    };
    slog("[scaling-engine] SCALE_UP suggestion", { increase: 0.3, ctr, conversionRate, healthScore });
    return d;
  }

  return {
    action: "KEEP",
    reversible: true,
    note: "Monitor; no strong scale or kill signal.",
  };
}
