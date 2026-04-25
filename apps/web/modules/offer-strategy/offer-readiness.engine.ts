import type { OfferReadinessResult, OfferStrategyContext } from "@/modules/offer-strategy/offer-strategy.types";
import { offerStrategyLog } from "@/modules/offer-strategy/offer-strategy-logger";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function hasObjectionType(ctx: OfferStrategyContext, t: string) {
  const raw = ctx.objections;
  if (raw && typeof raw === "object" && "objections" in raw) {
    const arr = (raw as { objections?: { type?: string }[] }).objections;
    if (Array.isArray(arr)) return arr.some((o) => o?.type === t);
  }
  return false;
}

/**
 * Deterministic 0–100. Heuristic only — not a promise of a successful offer.
 */
export function computeOfferReadiness(context: OfferStrategyContext): OfferReadinessResult {
  try {
    const rationale: string[] = [];
    let score = 38;
    if (context.closingReadinessScore != null) {
      score += clamp((context.closingReadinessScore - 50) * 0.28, -10, 22);
      rationale.push("Prior closing-readiness style score is blended in as one signal (not a verdict).");
    }
    if (context.dealProbability != null) {
      score += clamp((context.dealProbability - 50) * 0.2, -8, 12);
    }
    if (context.visitCompleted === true) {
      score += 12;
      rationale.push("A completed visit (per context flags) often supports a cleaner offer discussion path — confirm in your files.");
    }
    if (context.visitScheduled === true && context.visitCompleted !== true) {
      score += 4;
      rationale.push("A visit is scheduled; many brokers align offer talk after a tour that matches the client’s experience.");
    }
    if (context.offerDiscussed === true) {
      score += 10;
      rationale.push("Offer or terms have been broached in thread or deal status — still not a signal to file anything automatically.");
    }
    const fin = context.financingReadiness ?? "unknown";
    if (fin === "strong" || fin === "medium") {
      score += fin === "strong" ? 10 : 5;
      rationale.push("Financing-readiness hint leans stronger — process-only framing, not an approval or rate claim.");
    } else if (fin === "weak") {
      score -= 12;
      rationale.push("Weaker financing clarity often means more discovery before offer mechanics.");
    }
    if (context.engagementScore != null) {
      score += clamp((context.engagementScore - 50) * 0.25, -12, 15);
    }
    if (context.urgencyLevel === "high") score += 5;
    if (context.urgencyLevel === "low") score -= 5;
    if (hasObjectionType(context, "price")) {
      score -= 8;
      rationale.push("A price concern signal exists — value alignment work may precede a confident offer posture.");
    }
    if (hasObjectionType(context, "property_fit")) {
      score -= 7;
      rationale.push("Property-fit tension can block offer comfort until trade-offs are clear.");
    }
    if (hasObjectionType(context, "trust")) {
      score -= 10;
      rationale.push("Trust-related wording appeared — transparency before pressure usually fits.");
    }
    if (hasObjectionType(context, "timing")) {
      score -= 4;
    }
    if (context.silenceGapDays != null && context.silenceGapDays > 4) {
      score -= Math.min(22, 6 + context.silenceGapDays * 2);
      rationale.push("Silence gap may cool momentum — a light re-open can precede offer language.");
    }
    if (context.trustLevel === "low") {
      score -= 8;
      rationale.push("Trust read is low in this pass — your field judgment may differ.");
    }
    if (context.priceSensitivity === "high") {
      score -= 4;
      rationale.push("Price sensitivity is elevated in this read — calibrate offer talk as coaching, not pricing advice.");
    }
    if (context.hesitationOrComparisonHint) {
      score -= 5;
      rationale.push("Hesitation or comparison hints appeared — avoid implying market outcomes you cannot support.");
    }

    score = Math.round(clamp(score, 0, 100));
    let label: OfferReadinessResult["label"] = "discussion_ready";
    if (score <= 34) label = "not_ready";
    else if (score <= 59) label = "discussion_ready";
    else if (score <= 79) label = "offer_ready";
    else label = "high_offer_intent";

    offerStrategyLog.offerReadinessComputed({ score, label });
    return { score, label, rationale: rationale.slice(0, 8) };
  } catch (e) {
    offerStrategyLog.warn("offer_readiness_error", { err: e instanceof Error ? e.message : String(e) });
    return {
      score: 40,
      label: "discussion_ready",
      rationale: ["Heuristic fallback — this is not legal, tax, or financing advice; review the file manually."],
    };
  }
}
