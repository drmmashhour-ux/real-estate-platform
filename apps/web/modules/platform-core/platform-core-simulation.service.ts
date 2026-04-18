/**
 * Platform Core V2 — heuristic impact preview only (not predictive modeling).
 */
import { platformCoreFlags } from "@/config/feature-flags";
import type { CoreDecisionRecord, CoreDecisionSimulationResult } from "./platform-core.types";

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/**
 * Returns bounded deltas for CTR, conversion, and profit — clearly labeled as heuristic.
 */
export function simulateDecisionImpact(decision: CoreDecisionRecord): CoreDecisionSimulationResult | null {
  if (!platformCoreFlags.platformCoreV1 || !platformCoreFlags.platformCoreSimulationV1) {
    return null;
  }

  const m = decision.metadata && typeof decision.metadata === "object" ? (decision.metadata as Record<string, unknown>) : {};
  const trust = typeof m.trustScore === "number" ? m.trustScore : decision.confidenceScore;

  const baseLift = clamp(trust * 0.08, 0.005, 0.12);
  const ctrDelta = baseLift * (decision.source === "CRO" ? 1.2 : 1);
  const conversionDelta = baseLift * (decision.source === "RETARGETING" ? 1.15 : 0.95);
  const profitDelta = baseLift * 1.1 * (typeof m.profitImpact === "number" ? 0.5 + m.profitImpact : 1);

  const risks: string[] = [
    "Heuristic only — validate against real experiments or production metrics before relying on numbers.",
  ];
  if (trust < 0.65) risks.push("Low trust / confidence — wide variance in real outcomes.");
  if (decision.status === "BLOCKED" || (Array.isArray(decision.blockers) && decision.blockers.length > 0)) {
    risks.push("Blockers present — execution may not be comparable to this preview.");
  }

  return {
    label: "heuristic_estimate",
    expectedCtrDelta: Number(ctrDelta.toFixed(4)),
    expectedConversionDelta: Number(conversionDelta.toFixed(4)),
    expectedProfitDelta: Number(profitDelta.toFixed(4)),
    confidence: clamp(trust, 0, 1),
    risks,
    notes: [
      "Heuristic preview only — not a calibrated forecast.",
      "Use experiments or production metrics before treating numbers as targets.",
    ],
  };
}
