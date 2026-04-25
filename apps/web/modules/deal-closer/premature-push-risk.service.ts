import type { DealCloserContext, CloseBlocker, ClosingReadinessResult } from "@/modules/deal-closer/deal-closer.types";
import { dealCloserLog } from "@/modules/deal-closer/deal-closer-logger";

export type PrematurePushLevel = "low" | "medium" | "high";

/**
 * Heuristic: when a "close now" style push may be early. Not a personal judgment.
 */
export function computePrematurePushRisk(
  context: DealCloserContext,
  readiness: ClosingReadinessResult,
  blockers: CloseBlocker[]
): PrematurePushLevel {
  try {
    let weight = 0;
    if (readiness.label === "not_ready") weight += 2;
    if (readiness.label === "warming_up") weight += 1;
    if ((context.silenceGapDays ?? 0) > 4) weight += 2;
    if (blockers.some((b) => b.key === "unresolved_price_objection" && b.severity === "high")) weight += 2;
    if (blockers.some((b) => b.key === "long_silence")) weight += 2;
    if (blockers.some((b) => b.key === "trust_gap")) weight += 1;
    if (context.visitScheduled !== true && (context.dealStage ?? "").toLowerCase().includes("negot")) weight += 1;
    if (context.financingReadiness === "weak" && (context.engagementScore ?? 0) < 50) weight += 2;
    if (context.offerDiscussed === true && (context.engagementScore ?? 0) < 40) weight += 1;
    if (blockers.some((b) => b.key === "weak_property_fit" && b.severity !== "low")) weight += 1;

    const level: PrematurePushLevel = weight >= 4 ? "high" : weight >= 2 ? "medium" : "low";
    dealCloserLog.prematurePushRiskComputed({ level, weight });
    return level;
  } catch (e) {
    dealCloserLog.warn("premature_push_error", { err: e instanceof Error ? e.message : String(e) });
    return "medium";
  }
}
