import type {
  RecommendationAction,
  RecommendationMetrics,
  RecommendationReason,
  RecommendationResult,
  RecommendationRisk,
  RecommendationType,
} from "@/modules/investment/recommendation.types";
import { clamp, round2 } from "@/modules/investment/recommendation-math";
import { loadListingRecommendationMetrics } from "@/modules/investment/recommendation-metrics.service";

function pushReason(
  arr: RecommendationReason[],
  label: string,
  message: string,
  impact: "positive" | "negative" | "neutral"
) {
  arr.push({ label, message, impact });
}

function pushRisk(arr: RecommendationRisk[], severity: "low" | "medium" | "high", message: string) {
  arr.push({ severity, message });
}

function pushAction(arr: RecommendationAction[], priority: "low" | "medium" | "high", message: string) {
  arr.push({ priority, message });
}

/**
 * Deterministic, rules-only BNHub investment stance — **not** predictive AI and **not** a guarantee of returns.
 */
export async function generateListingRecommendation(listingId: string): Promise<RecommendationResult> {
  const { listing, metrics: raw } = await loadListingRecommendationMetrics(listingId);

  const metrics: RecommendationMetrics = {
    listingId: raw.listingId,
    listingTitle: raw.listingTitle,
    dataNote: raw.dataNote,
    grossRevenue: raw.grossRevenue,
    occupancyRate: raw.occupancyRate,
    adr: raw.adr,
    revpar: raw.revpar,
    bookingCount: raw.bookingCount,
    roiAnnualized: raw.roiAnnualized,
    costCoverageRatio: raw.costCoverageRatio,
    revenueTrend: raw.revenueTrend,
    occupancyTrend: raw.occupancyTrend,
    purchasePriceRecorded: raw.purchasePriceRecorded,
    estimatedValueRecorded: raw.estimatedValueRecorded,
    operatingCostRecorded: raw.operatingCostRecorded,
  };

  let score = 50;

  const reasons: RecommendationReason[] = [];
  const risks: RecommendationRisk[] = [];
  const actions: RecommendationAction[] = [];

  pushReason(
    reasons,
    "Method",
    'Deterministic rules over BNHub booking-derived KPIs (same family as host revenue dashboard). Outputs are "signals" only — not forecasts and not personalized financial advice.',
    "neutral"
  );

  if (!metrics.estimatedValueRecorded) {
    pushRisk(
      risks,
      "medium",
      "Estimated value is not recorded on this listing — the platform is not asserting current market price."
    );
  }

  if (!metrics.purchasePriceRecorded && !metrics.estimatedValueRecorded && !metrics.operatingCostRecorded) {
    pushRisk(
      risks,
      "low",
      "Underwriting inputs are largely missing; treat stance as operational-only until purchase price / costs are recorded."
    );
  }

  // Occupancy
  if (metrics.occupancyRate >= 0.72) {
    score += 15;
    pushReason(reasons, "Occupancy", "Occupancy from the measured window indicates strong utilization versus available nights.", "positive");
  } else if (metrics.occupancyRate < 0.45) {
    score -= 18;
    pushReason(reasons, "Occupancy", "Occupancy from the measured window is weak versus available nights.", "negative");
    pushRisk(risks, "high", "Sustained low occupancy weakens realized revenue versus capacity in this window.");
  } else {
    pushReason(reasons, "Occupancy", "Occupancy from the measured window is moderate.", "neutral");
  }

  // RevPAR vs ADR
  if (metrics.revpar >= metrics.adr * 0.65 && metrics.adr > 0) {
    score += 12;
    pushReason(reasons, "RevPAR", "RevPAR is supporting a meaningful share of nightly rate once occupancy is accounted for.", "positive");
  } else if (metrics.adr > 0 && metrics.revpar < metrics.adr * 0.4) {
    score -= 12;
    pushReason(reasons, "RevPAR", "RevPAR is materially below ADR versus the measured window.", "negative");
    pushAction(actions, "high", "Review pricing and distribution coverage to raise filled nights versus potential ADR.");
  }

  // Revenue trend (snapshot-to-snapshot only — missing when history is insufficient)
  if ((metrics.revenueTrend ?? null) !== null) {
    if ((metrics.revenueTrend ?? 0) > 0.12) {
      score += 10;
      pushReason(reasons, "Revenue trend", "Recorded BNHub snapshot revenue rose versus the prior snapshot.", "positive");
    } else if ((metrics.revenueTrend ?? 0) < -0.15) {
      score -= 14;
      pushReason(reasons, "Revenue trend", "Recorded BNHub snapshot revenue declined versus the prior snapshot.", "negative");
      pushRisk(risks, "high", "Trend deterioration warrants review before scaling capital tied to this stay.");
    }
  } else {
    pushReason(
      reasons,
      "Revenue trend",
      "Insufficient stored BNHub snapshots to compute revenue trend yet (need at least two snapshots).",
      "neutral"
    );
  }

  // Occupancy trend
  if ((metrics.occupancyTrend ?? null) !== null) {
    if ((metrics.occupancyTrend ?? 0) > 0.08) {
      score += 6;
      pushReason(reasons, "Occupancy trend", "Occupancy rate rose between consecutive BNHub snapshots.", "positive");
    } else if ((metrics.occupancyTrend ?? 0) < -0.1) {
      score -= 8;
      pushReason(reasons, "Occupancy trend", "Occupancy rate declined between consecutive BNHub snapshots.", "negative");
    }
  }

  // ROI — simple annualization from trailing-window revenue ×12 (explicitly **not** a promised outcome)
  if (metrics.roiAnnualized !== null && metrics.roiAnnualized !== undefined) {
    if (metrics.roiAnnualized >= 0.12) {
      score += 18;
      pushReason(
        reasons,
        "ROI (simple)",
        "Simple annualized return vs recorded acquisition price uses 12× trailing-window revenue minus 12× recorded monthly operating cost — a modeling shortcut, not a promised future return.",
        "positive"
      );
    } else if (metrics.roiAnnualized < 0.04) {
      score -= 16;
      pushReason(
        reasons,
        "ROI (simple)",
        "Simple annualized return vs recorded acquisition price is weak using current BNHub inputs.",
        "negative"
      );
      pushRisk(risks, "high", "Weak modeled ROI implies capital may be strained unless operations improve.");
    } else {
      pushReason(reasons, "ROI (simple)", "Simple annualized return vs recorded acquisition price is moderate.", "neutral");
    }
  } else {
    pushRisk(risks, "medium", "ROI could not be evaluated because acquisition price was not recorded on the listing.");
  }

  // Cost coverage
  if (!metrics.operatingCostRecorded) {
    pushRisk(risks, "medium", "Monthly operating cost is missing — coverage ratios were not assessed.");
  } else if (metrics.costCoverageRatio !== null) {
    if (metrics.costCoverageRatio >= 2) {
      score += 10;
      pushReason(reasons, "Cost coverage", "Trailing-window gross revenue materially exceeds recorded monthly operating cost.", "positive");
    } else if (metrics.costCoverageRatio < 1.1) {
      score -= 15;
      pushReason(reasons, "Cost coverage", "Trailing-window gross revenue is close to recorded monthly operating cost.", "negative");
      pushRisk(risks, "high", "Thin margin versus recorded operating burn increases downside risk.");
    }
  }

  // Booking volume in window
  if (metrics.bookingCount >= 10) {
    score += 5;
    pushReason(reasons, "Booking volume", "Booking count in the measured window is comparatively healthy.", "positive");
  } else if (metrics.bookingCount <= 2) {
    score -= 7;
    pushReason(reasons, "Booking volume", "Booking count in the measured window is low.", "negative");
  }

  score = clamp(round2(score), 0, 100);

  let recommendation: RecommendationType = "watch";

  if (score >= 78) {
    recommendation = "buy";
    pushAction(
      actions,
      "high",
      "Consider expanding toward similar inventory **only** after independent underwriting and compliance checks — this engine does not validate suitability."
    );
  } else if (score >= 62) {
    recommendation = "hold";
    pushAction(actions, "medium", "Maintain positioning while monitoring BNHub KPI durability over subsequent snapshots.");
  } else if (score >= 45) {
    recommendation = "optimize";
    pushAction(actions, "high", "Prioritize pricing, listing quality, and conversion before reallocating portfolio capital.");
  } else if (score >= 30) {
    recommendation = "watch";
    pushAction(actions, "high", "Accelerate operational review — weak score does not mandate sale, but warrants closer monitoring.");
  } else {
    recommendation = "sell";
    pushAction(
      actions,
      "high",
      "Evaluate capital recycling if weak utilization, weak modeled ROI, and weak trend signals persist — not a mandate to transact."
    );
  }

  let confidenceScore = 0.55;
  if (metrics.roiAnnualized !== null) confidenceScore += 0.14;
  if (metrics.revenueTrend !== null) confidenceScore += 0.12;
  if (metrics.occupancyTrend !== null) confidenceScore += 0.1;
  if (metrics.purchasePriceRecorded) confidenceScore += 0.06;
  if (metrics.operatingCostRecorded) confidenceScore += 0.03;
  confidenceScore = clamp(round2(confidenceScore), 0, 1);

  return {
    recommendation,
    confidenceScore,
    score,
    reasons,
    risks,
    actions,
    metrics,
  };
}
