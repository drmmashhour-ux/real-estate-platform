import type { OfferStrategyContext, OfferStrategyOutput } from "@/modules/offer-strategy/offer-strategy.types";
import { computeOfferReadiness } from "@/modules/offer-strategy/offer-readiness.engine";
import { detectOfferBlockers } from "@/modules/offer-strategy/offer-blocker.engine";
import { computeCompetitiveOfferRisk } from "@/modules/offer-strategy/competitive-risk.engine";
import { recommendNegotiationPosture } from "@/modules/offer-strategy/negotiation-posture.engine";
import { recommendOfferActions } from "@/modules/offer-strategy/offer-recommendation.engine";
import { offerStrategyLog } from "@/modules/offer-strategy/offer-strategy-logger";

/**
 * Full offer-strategy pass: coaching and ordering only; no offer submission.
 */
export function runOfferStrategy(context: OfferStrategyContext): OfferStrategyOutput {
  try {
    const readiness = computeOfferReadiness(context);
    const blockers = detectOfferBlockers(context);
    const competitiveRisk = computeCompetitiveOfferRisk(context);
    const posture = recommendNegotiationPosture(context, readiness, blockers, competitiveRisk);
    const recommendations = recommendOfferActions(context, readiness, posture, blockers, competitiveRisk);

    const coachNotes: string[] = [
      "This panel does not submit or generate offers. You always choose what to say and when.",
      "Avoid legal interpretation of contracts and avoid guaranteed financial outcomes in client messages.",
    ];
    if (readiness.label === "offer_ready" || readiness.label === "high_offer_intent") {
      coachNotes.push("Readiness for offer discussion may be there — still confirm financing and fit in your own workflow first if needed.");
    } else {
      coachNotes.push("A softer path may fit until blockers and trust catch up to the client’s interest.");
    }
    if (competitiveRisk.level === "high") {
      coachNotes.push("Competition risk is a hint from text, not proof of other bidders — keep language factual and non-alarmist.");
    }
    if (posture.style === "hold_and_nurture") {
      coachNotes.push("The suggested posture is to nurture; a hard offer push in chat may be counterproductive in this read.");
    }

    offerStrategyLog.offerStrategyRun({
      readiness: readiness.label,
      posture: posture.style,
      comp: competitiveRisk.level,
    });
    return {
      readiness,
      posture,
      blockers,
      competitiveRisk,
      recommendations,
      coachNotes: coachNotes.slice(0, 6),
    };
  } catch (e) {
    offerStrategyLog.warn("offer_strategy_error", { err: e instanceof Error ? e.message : String(e) });
    return {
      readiness: { score: 30, label: "not_ready", rationale: ["Fallback: limited signal."] },
      posture: {
        style: "soft_explore",
        rationale: ["Use manual review; this is not legal or financial advice."],
        warnings: [],
      },
      blockers: [
        { key: "low_data", label: "Limited data", severity: "low", rationale: ["Heuristic pass could not run fully."] },
      ],
      competitiveRisk: { level: "medium", rationale: ["Unknown competition read."] },
      recommendations: [
        { key: "pause_and_nurture", title: "Manual next step", priority: "low", rationale: ["Proceed with your own checklist."] },
      ],
      coachNotes: ["No automated action; nothing was sent to the client."],
    };
  }
}
