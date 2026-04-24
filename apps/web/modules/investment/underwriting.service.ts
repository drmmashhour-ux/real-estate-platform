import { round2, safeDivide } from "@/modules/investment/recommendation-math";
import type { UnderwritingInput, UnderwritingResult } from "@/modules/investment/underwriting.types";

function finite(n: number, fallback = 0): number {
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Simplified short-term rental economics (deterministic):
 * `monthlyRevenue ≈ ADR × occupancy × 30` (treats ADR as average nightly revenue before fees/taxes).
 * Not a booking-level simulation and **not** a forecast of future performance.
 */
export function runUnderwriting(input: UnderwritingInput): UnderwritingResult {
  const adr = Math.max(0, finite(input.adr));
  const occupancyRate = Math.min(1, Math.max(0, finite(input.occupancyRate)));
  const monthlyCost = Math.max(0, finite(input.monthlyCost));
  const purchasePrice = Math.max(0, finite(input.purchasePrice));

  const monthlyRevenue = adr * occupancyRate * 30;
  const annualRevenue = monthlyRevenue * 12;
  const annualCost = monthlyCost * 12;

  const cashFlowMonthly = monthlyRevenue - monthlyCost;

  const roi = purchasePrice > 0 ? round2(safeDivide(annualRevenue - annualCost, purchasePrice)) : 0;

  const capRate = purchasePrice > 0 ? round2(safeDivide(annualRevenue, purchasePrice)) : 0;

  const breakEvenOccupancy = adr > 0 ? round2(safeDivide(monthlyCost, adr * 30)) : 0;

  return {
    monthlyRevenue: round2(finite(monthlyRevenue)),
    annualRevenue: round2(finite(annualRevenue)),
    annualCost: round2(finite(annualCost)),
    cashFlowMonthly: round2(finite(cashFlowMonthly)),
    roi: finite(roi),
    capRate: finite(capRate),
    breakEvenOccupancy: Math.min(1, Math.max(0, finite(breakEvenOccupancy))),
    reasoning: `Deterministic model-based projection. ROI is ${roi.toFixed(2)}% based on annual revenue of $${annualRevenue.toLocaleString()} and costs of $${annualCost.toLocaleString()}.`,
    confidence: 0.85, // High confidence for deterministic models
    disclaimer: "AI-PROJECTION-DISCLAIMER: Projections are for informational purposes only and do not constitute financial advice.",
    methodologyNote:
      "Revenue uses your ADR × occupancy × 30 (nights) as a static monthly proxy. Excludes taxes, platform fees, seasonality, and debt service unless you extend the model.",
  };
}
