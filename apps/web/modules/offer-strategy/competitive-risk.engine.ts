import type { CompetitiveOfferRisk, OfferStrategyContext } from "@/modules/offer-strategy/offer-strategy.types";
import { offerStrategyLog } from "@/modules/offer-strategy/offer-strategy-logger";

/**
 * Estimates risk of a competitive situation from text/behavior hints — not a fact about other offers.
 */
export function computeCompetitiveOfferRisk(context: OfferStrategyContext): CompetitiveOfferRisk {
  try {
    const rationale: string[] = [];
    let w = 0;
    const cs = context.competitiveSignals;
    if (cs?.mentionedOtherProperties) {
      w += 2;
      rationale.push("The thread hinted at other properties — clients often compare; this is a workflow hint only.");
    }
    if (cs?.mentionedOtherOffers) {
      w += 3;
      rationale.push("Other offers or competition were mentioned in text — not verified and not a legal statement.");
    }
    if (cs?.delayedDecision && (context.urgencyLevel === "high" || (context.engagementScore ?? 0) > 55)) {
      w += 2;
      rationale.push("High interest signals but delayed action can indicate parallel options — keep tone calm and timely.");
    }
    if (has("competition", context)) {
      w += 2;
      rationale.push("A competition-style keyword appeared in objection pass — still heuristic.");
    }
    if ((context.engagementScore ?? 0) > 60 && (context.silenceGapDays ?? 0) > 2) {
      w += 1;
      rationale.push("Engagement was stronger earlier with a recent gap — consider a timely, non-pushy check-in if it fits.");
    }
    const body = JSON.stringify(context.clientMemory ?? "").toLowerCase();
    if (/comparing|another offer|other buyers|bidding|multiple offer/i.test(body)) {
      w += 2;
      rationale.push("Broker/client memory text suggested comparison language — treat as a soft flag, not evidence.");
    }

    const level: CompetitiveOfferRisk["level"] = w >= 5 ? "high" : w >= 2 ? "medium" : "low";
    if (rationale.length === 0) {
      rationale.push("No strong competition-style flags in this pass — still use your own market read.");
    }
    offerStrategyLog.competitiveRiskComputed({ level, w });
    return { level, rationale: rationale.slice(0, 5) };
  } catch (e) {
    offerStrategyLog.warn("competitive_risk_error", { err: e instanceof Error ? e.message : String(e) });
    return { level: "medium", rationale: ["Neutral risk placeholder — review locally."] };
  }
}

function has(t: string, ctx: OfferStrategyContext) {
  const raw = ctx.objections;
  if (raw && typeof raw === "object" && "objections" in raw) {
    const arr = (raw as { objections?: { type?: string }[] }).objections;
    if (Array.isArray(arr)) return arr.some((o) => o?.type === t);
  }
  return false;
}
