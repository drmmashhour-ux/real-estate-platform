import crypto from "crypto";
import type { CeoMarketSignals } from "./ceo-ai.types";
import type { CeoContext } from "./ceo.types";

export class CeoMemoryContextService {
  /**
   * Builds a deterministic compact fingerprint string from the CEO context.
   * This allows similar strategic situations to be compared over time.
   */
  static buildCeoContextFingerprint(context: CeoContext): string {
    const buckets = {
      growth: this.bucketTrend(context.growth.trend),
      deals: this.bucketRate(context.deals.closeRate),
      dealRisk: this.bucketRate(context.deals.avgRejectionRate),
      esg: this.bucketScore(context.esg.avgScore),
      rollout: this.bucketCount(context.rollout.activeCount),
      agents: this.bucketRate(context.agents.successSignals),
    };

    const rawString = JSON.stringify(buckets);
    return crypto.createHash("sha256").update(rawString).digest("hex").slice(0, 16);
  }

  private static bucketTrend(trend: number): string {
    if (trend < -0.2) return "CRASH";
    if (trend < -0.05) return "DECLINE";
    if (trend < 0.05) return "STABLE";
    if (trend < 0.2) return "GROWTH";
    return "SURGE";
  }

  private static bucketRate(rate: number): string {
    if (rate < 0.1) return "CRITICAL";
    if (rate < 0.4) return "WEAK";
    if (rate < 0.7) return "HEALTHY";
    return "STRONG";
  }

  private static bucketScore(score: number): string {
    if (score < 30) return "LOW";
    if (score < 70) return "MID";
    return "HIGH";
  }

  private static bucketCount(count: number): string {
    if (count === 0) return "NONE";
    if (count < 3) return "LOW";
    if (count < 10) return "MID";
    return "HIGH";
  }
}

function isCeoContext(x: unknown): x is CeoContext {
  return (
    typeof x === "object" &&
    x !== null &&
    "growth" in x &&
    typeof (x as CeoContext).growth === "object" &&
    "deals" in x &&
    "timestamp" in x
  );
}

/**
 * Stable fingerprint for {@link CeoMarketSignals} (AI CEO path) — bucketed so small drift stays identical.
 */
export function buildCeoContextFingerprintFromSignals(signals: CeoMarketSignals): string {
  const leadTrend =
    signals.leadsPrev30d > 0 ? (signals.leadsLast30d - signals.leadsPrev30d) / signals.leadsPrev30d : 0;
  const buckets = {
    leads: leadTrend < -0.1 ? "DOWN" : leadTrend > 0.1 ? "UP" : "FLAT",
    demand: signals.demandIndex < 0.35 ? "WEAK" : signals.demandIndex > 0.55 ? "STRONG" : "STABLE",
    rev: signals.revenueTrend30dProxy < -0.02 ? "NEG" : signals.revenueTrend30dProxy > 0.02 ? "POS" : "FLAT",
    conversion:
      signals.seniorConversionRate30d < 0.055 ? "LOW" : signals.seniorConversionRate30d > 0.075 ? "HIGH" : "MID",
    deals: signals.dealPipelineHealth < 0.35 ? "WEAK" : signals.dealPipelineHealth > 0.65 ? "STRONG" : "MID",
    esg: signals.esgActivityLevel < 0.35 ? "LOW" : signals.esgActivityLevel > 0.65 ? "HIGH" : "MID",
  };
  return crypto.createHash("sha256").update(JSON.stringify(buckets)).digest("hex").slice(0, 16);
}

/**
 * Unified entry: strategic {@link CeoContext} or operational {@link CeoMarketSignals}.
 */
export function buildCeoContextFingerprint(context: CeoContext | CeoMarketSignals): string {
  if (isCeoContext(context)) {
    return CeoMemoryContextService.buildCeoContextFingerprint(context);
  }
  return buildCeoContextFingerprintFromSignals(context);
}
