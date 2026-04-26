/**
 * High-level optimization narrative — deterministic rules over signals + feedback.
 */

import type { MarketplaceOutcomeFeedback } from "./darlink-marketplace-autonomy.types";
import type { MarketplaceSignal } from "./darlink-marketplace-autonomy.types";

export type MarketplaceOptimizationSummary = {
  working: readonly string[];
  blocked: readonly string[];
  needsHumanReview: readonly string[];
  thresholdAdjustmentsHint: readonly string[];
};

export function buildMarketplaceOptimizationSummary(params: {
  signals: MarketplaceSignal[];
  feedback: MarketplaceOutcomeFeedback | null;
}): MarketplaceOptimizationSummary {
  try {
    const working: string[] = [];
    const blocked: string[] = [];
    const needsHumanReview: string[] = [];
    const thresholdAdjustmentsHint: string[] = [];

    if (params.signals.some((s) => s.type === "engagement_spike")) {
      working.push("Inbound engagement signals detected — funnel has traffic.");
    }
    if (params.signals.some((s) => s.type === "fraud_risk")) {
      blocked.push("Fraud-risk lane active — automation must stay gated.");
      needsHumanReview.push("Review flagged listings/bookings before payouts.");
    }
    if (params.feedback?.trustRiskFlagsCount && params.feedback.trustRiskFlagsCount > 3) {
      thresholdAdjustmentsHint.push("Consider tightening trust/content thresholds after admin review.");
    }

    return {
      working,
      blocked,
      needsHumanReview,
      thresholdAdjustmentsHint,
    };
  } catch {
    return {
      working: [],
      blocked: [],
      needsHumanReview: [],
      thresholdAdjustmentsHint: [],
    };
  }
}
