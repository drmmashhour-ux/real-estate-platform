import type {
  CompetitiveOfferRisk,
  OfferBlocker,
  OfferPosture,
  OfferReadinessResult,
  OfferStrategyContext,
} from "@/modules/offer-strategy/offer-strategy.types";
import { offerStrategyLog } from "@/modules/offer-strategy/offer-strategy-logger";

/**
 * Suggested tone for how to discuss offers — not a script and not an instruction to file an offer.
 */
export function recommendNegotiationPosture(
  context: OfferStrategyContext,
  readiness: OfferReadinessResult,
  blockers: OfferBlocker[],
  competitiveRisk: CompetitiveOfferRisk
): OfferPosture {
  try {
    const highB = blockers.filter((b) => b.severity === "high").length;
    const mediumB = blockers.filter((b) => b.severity === "medium").length;
    const warnings: string[] = [];
    let style: OfferPosture["style"] = "soft_explore";
    const rationale: string[] = [];

    if (readiness.label === "not_ready" || highB >= 2 || (context.silenceGapDays ?? 0) > 6) {
      style = "hold_and_nurture";
      rationale.push("Readiness is low, blockers are material, or silence is long — a softer sequence usually fits before offer talk.");
      warnings.push("Do not interpret this as permission to make pricing promises or to submit an offer in the product.");
    } else if (readiness.label === "discussion_ready" || (mediumB >= 1 && readiness.label !== "high_offer_intent")) {
      style = "guided_offer_discussion";
      rationale.push("The client may be ready to talk about how offers work, with reassurance and room for questions — still your professional framing.");
    } else if (readiness.label === "high_offer_intent" && highB === 0 && competitiveRisk.level !== "high") {
      style = "confident_offer_push";
      rationale.push("Signals lean positive with fewer blockers — you may move with clearer next steps while staying compliant.");
      warnings.push("Confident posture here means communication confidence, not automatic or guaranteed transactions.");
    } else if (readiness.label === "offer_ready" && highB <= 1) {
      style = "guided_offer_discussion";
      rationale.push("Close to offer talk, but at least one friction point may need airtime first.");
    } else {
      style = "soft_explore";
      rationale.push("Interest is present; uncertainty is still meaningful — explore fit, timing, and process before offer mechanics.");
    }

    if (competitiveRisk.level === "high") {
      if (style === "confident_offer_push") {
        style = "guided_offer_discussion";
        rationale.push("Competition risk reads higher — a calm, time-aware discussion often beats a hard push.");
      }
      warnings.push("Competition is estimated from hints, not proven — avoid stating there are other offers as fact.");
    }
    if (context.financingReadiness === "weak" && style === "confident_offer_push") {
      style = "guided_offer_discussion";
      warnings.push("Financing clarity is still shaky in this read — process talk before numbers.");
    }

    offerStrategyLog.negotiationPostureRecommended({ style, readiness: readiness.label });
    return { style, rationale: rationale.slice(0, 4), warnings: warnings.slice(0, 3) };
  } catch (e) {
    offerStrategyLog.warn("posture_error", { err: e instanceof Error ? e.message : String(e) });
    return {
      style: "soft_explore",
      rationale: ["Fallback: keep language neutral and non-committal; not legal or financial advice."],
      warnings: ["Review the client situation manually before any offer step."],
    };
  }
}
