import type { ListingAllocationMetrics, AllocationCandidate } from "./capital-allocator.types";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

/**
 * Deterministic priority + **suggested** dollar need (ceiling) per listing. Not a return guarantee.
 */
export function buildAllocationCandidate(metrics: ListingAllocationMetrics): AllocationCandidate {
  if (metrics.manualCapitalLock) {
    return {
      listingId: metrics.listingId,
      listingTitle: metrics.listingTitle,
      allocationType: "hold",
      priorityScore: 0,
      expectedImpactScore: 20,
      confidenceScore: 0.5,
      recommendedAmount: 0,
      rationale: [
        "Host/operator set manual capital lock on this listing — no pool allocation in this plan (recommendation-only).",
      ],
      metrics,
    };
  }

  let priorityScore = 50;
  let expectedImpactScore = 50;
  let confidenceScore = 0.55;
  const rationale: string[] = [];

  let allocationType: AllocationCandidate["allocationType"] = "hold";
  let recommendedAmount = 0;

  const rec = (metrics.recommendation ?? "").toLowerCase().trim();

  if (rec === "buy" || rec === "accumulate" || rec === "add") {
    priorityScore += 20;
    expectedImpactScore += 15;
    rationale.push("Active investment stance suggests capital can support growth (from platform recommendation row).");
  }

  if (rec === "optimize" || rec === "improve") {
    priorityScore += 10;
    expectedImpactScore += 10;
    rationale.push("Listing is flagged for optimization rather than exit.");
  }

  if (rec === "sell" || rec === "reduce" || rec === "exit") {
    priorityScore -= 25;
    expectedImpactScore -= 20;
    allocationType = "reduce";
    rationale.push("Investment stance suggests constraining new discretionary spend on this listing.");
  }

  if (metrics.occupancyRate >= 0.72) {
    priorityScore += 10;
    expectedImpactScore += 8;
    rationale.push("Occupancy from counted stays in the KPI window is strong.");
  } else if (metrics.occupancyRate < 0.45) {
    priorityScore -= 6;
    expectedImpactScore += 6;
    rationale.push("Occupancy is soft — prioritize conversion/ops before scaling media spend.");
  }

  if (metrics.revpar > 0 && metrics.adr > 0 && metrics.revpar >= metrics.adr * 0.65) {
    priorityScore += 8;
    rationale.push("RevPAR is healthy relative to ADR in-window (internal BNHub definitions).");
  } else if (metrics.adr > 0 && metrics.revpar < metrics.adr * 0.4) {
    expectedImpactScore += 8;
    rationale.push("RevPAR lags ADR — upside may exist from occupancy/distribution (not guaranteed).");
  }

  if ((metrics.upliftScore ?? 0) > 0.08) {
    priorityScore += 12;
    expectedImpactScore += 10;
    rationale.push("Recent autonomy outcome uplift signal is positive (internal estimate, not causal proof).");
  } else if ((metrics.upliftScore ?? 0) < -0.05) {
    priorityScore -= 10;
    rationale.push("Recent uplift-adjusted outcomes were weak — keep incremental spend cautious.");
  }

  if ((metrics.pricingActionSuccess ?? 0) > 0.05) {
    expectedImpactScore += 6;
    rationale.push("Recorded average reward on pricing rule weight is positive.");
  }

  if ((metrics.operationalRiskScore ?? 0) > 0.7) {
    allocationType = "operations";
    priorityScore += 8;
    expectedImpactScore += 10;
    rationale.push("Operational risk score on file is elevated — bias to operations bucket.");
  }

  if ((metrics.marketingBudgetNeed ?? 0) > 0 && metrics.occupancyRate >= 0.55) {
    allocationType = "growth";
    recommendedAmount += metrics.marketingBudgetNeed ?? 0;
    rationale.push("Marketing budget need is set on the listing and utilization is adequate for growth experiments.");
  }

  if ((metrics.improvementBudgetNeed ?? 0) > 0 && allocationType !== "reduce") {
    if (allocationType === "hold") allocationType = "optimize";
    recommendedAmount += metrics.improvementBudgetNeed ?? 0;
    rationale.push("Improvement budget need is present on the listing row.");
  }

  if (allocationType === "hold" && rec !== "sell" && rec !== "exit" && rec !== "reduce") {
    if (metrics.occupancyRate >= 0.7 && (metrics.upliftScore ?? 0) >= 0) {
      allocationType = "growth";
      recommendedAmount += metrics.marketingBudgetNeed ?? 500;
      rationale.push("Healthy operating signal — template growth placeholder until marketing need is captured.");
    } else if (metrics.occupancyRate < 0.55) {
      allocationType = "pricing";
      recommendedAmount += 400;
      rationale.push("Moderate pricing/conversion support placeholder (approval required before spend).");
    }
  }

  /** Weak operating + uplift signals: recommend pausing new discretionary capital (no execution here). */
  if (
    allocationType !== "reduce" &&
    allocationType !== "growth" &&
    allocationType !== "operations" &&
    allocationType !== "optimize" &&
    metrics.occupancyRate < 0.38 &&
    (metrics.upliftScore ?? 0) < -0.06 &&
    rec !== "buy"
  ) {
    allocationType = "pause";
    recommendedAmount = 0;
    rationale.push(
      "Low occupancy and weak uplift-adjusted autonomy outcome — pause new discretionary capital pending review (recommendation only).",
    );
  }

  if (allocationType === "reduce") {
    recommendedAmount = 0;
  }

  if (metrics.recommendationConfidence !== null) {
    confidenceScore += metrics.recommendationConfidence * 0.15;
  }

  if (metrics.upliftScore !== null) {
    confidenceScore += 0.1;
  }

  priorityScore = round2(clamp(priorityScore, 0, 100));
  expectedImpactScore = round2(clamp(expectedImpactScore, 0, 100));
  confidenceScore = round2(clamp(confidenceScore, 0.1, 0.99));
  recommendedAmount = round2(Math.max(0, recommendedAmount));

  return {
    listingId: metrics.listingId,
    listingTitle: metrics.listingTitle,
    allocationType,
    priorityScore,
    expectedImpactScore,
    confidenceScore,
    recommendedAmount,
    rationale,
    metrics,
  };
}
