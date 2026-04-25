import type { NegotiationSimulatorContext, MomentumRiskResult } from "./negotiation-simulator.types";

function coalesceReadiness(offer: number | null | undefined, close: number | null | undefined): number {
  if (typeof offer === "number" && typeof close === "number")
    return Math.max(0, Math.min(1, (offer + close) / 2));
  if (typeof offer === "number") return Math.max(0, Math.min(1, offer));
  if (typeof close === "number") return Math.max(0, Math.min(1, close));
  return 0.5;
}

function blockerCount(b: unknown): number {
  if (Array.isArray(b)) return b.length;
  if (b && typeof b === "object" && "length" in b) {
    const l = (b as { length: number }).length;
    if (typeof l === "number" && l >= 0) return l;
  }
  return 0;
}

/**
 * Heuristic risk — not a prediction, suggestions only.
 */
export function computeMomentumRisk(context: NegotiationSimulatorContext): MomentumRiskResult {
  const rationale: string[] = [];
  let score = 0;

  const days = context.silenceGapDays;
  if (typeof days === "number" && days > 5) {
    score += 2;
    rationale.push("Extended silence can reduce perceived momentum; consider a well-timed touchpoint if appropriate.");
  } else if (typeof days === "number" && days > 2) {
    score += 1;
    rationale.push("A short gap in contact may be normal, but it slightly increases stalling risk.");
  }

  const readiness = coalesceReadiness(context.offerReadinessScore, context.closingReadinessScore);
  if (readiness >= 0.55) {
    score += 1;
    rationale.push("Readiness is relatively strong without fresh engagement — follow-up may help keep alignment.");
  }

  if (context.competitiveRisk === "high") {
    score += 1;
    rationale.push("Competition or comparison signals are present; delay may increase the chance the client deprioritizes this deal in their mind.");
  }
  if (context.competitiveRisk === "medium" && (typeof days === "number" ? days : 0) > 1) {
    score += 1;
    rationale.push("Medium competition risk with delay can compound; momentum is somewhat fragile.");
  }

  const bCount = blockerCount(context.blockers);
  if (bCount >= 3) {
    score += 1;
    rationale.push("Multiple unresolved blockers can slow progress until at least one is addressed.");
  }

  if ((context.engagementScore ?? 0.5) < 0.4 && readiness >= 0.6) {
    score += 1;
    rationale.push("Low recent engagement after relatively strong signals may indicate cooling interest.");
  }

  if (context.postponementHint) {
    score += 1;
    rationale.push("Postponement or deferral patterns were noted; momentum can stall if the next step is unclear.");
  }

  if (bCount > 0 && bCount < 2 && (context.engagementScore ?? 0.5) < 0.3) {
    /* minor */
  }

  if (rationale.length === 0) {
    rationale.push("Limited signals; use this as a light qualitative read only, not a fixed risk score.");
  }

  const level: MomentumRiskResult["level"] = score >= 4 ? "high" : score >= 2 ? "medium" : "low";
  return { level, rationale: rationale.slice(0, 6) };
}
