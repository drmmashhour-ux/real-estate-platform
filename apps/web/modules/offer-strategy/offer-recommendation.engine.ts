import type {
  CompetitiveOfferRisk,
  OfferActionRecommendation,
  OfferBlocker,
  OfferPosture,
  OfferReadinessResult,
  OfferStrategyContext,
} from "@/modules/offer-strategy/offer-strategy.types";
import { offerStrategyLog } from "@/modules/offer-strategy/offer-strategy-logger";

function hasKey(blockers: OfferBlocker[], k: string) {
  return blockers.some((b) => b.key === k);
}

/**
 * Ranked next steps — never execute automatically; no offer submission in product.
 */
export function recommendOfferActions(
  context: OfferStrategyContext,
  readiness: OfferReadinessResult,
  posture: OfferPosture,
  blockers: OfferBlocker[],
  competitiveRisk: CompetitiveOfferRisk
): OfferActionRecommendation[] {
  try {
    const out: OfferActionRecommendation[] = [];
    const hold = posture.style === "hold_and_nurture";
    const aggr = (x: OfferActionRecommendation) => {
      if (hold && /offer|urgency|market/i.test(x.key) && x.key !== "pause_and_nurture" && x.key !== "follow_up_today") {
        x.priority = "low";
        x.rationale = [
          ...x.rationale,
          "Deprioritized while posture is hold/nurture — a push may add resistance.",
        ];
      }
      return x;
    };

    if (hasKey(blockers, "financing_uncertainty") || context.financingReadiness === "weak") {
      out.push(
        aggr({
          key: "clarify_financing_before_offer",
          title: "Clarify financing process (not rates or approval)",
          priority: "high",
          rationale: [
            "Process clarity helps clients know what to do next with a lender or mortgage professional — you give the wording.",
          ],
          suggestedApproach: "Offer a short checklist of next human steps; avoid rate quotes or approval claims.",
        })
      );
    }
    if (hasKey(blockers, "weak_property_fit") || hasKey(blockers, "unresolved_price_objection")) {
      out.push(
        aggr({
          key: "address_price_concern",
          title: "Work value and inclusions in your voice",
          priority: "high",
          rationale: ["Align on what the price includes and what matters to the client before numeric offers in chat."],
        })
      );
    }
    if (hasKey(blockers, "no_visit_completed") && context.visitCompleted !== true) {
      out.push(
        aggr({
          key: "encourage_visit_before_offer",
          title: "Align on a visit (if that is your process)",
          priority: "medium",
          rationale: [
            "If you normally tour before offers, help the client book a time you can actually confirm access for.",
          ],
        })
      );
    }
    if (readiness.label === "offer_ready" || readiness.label === "high_offer_intent") {
      out.push(
        aggr({
          key: "propose_offer_discussion",
          title: "Propose a structured offer discussion (conversation only)",
          priority: competitiveRisk.level === "high" ? "high" : "medium",
          rationale: [
            "Offer to walk through how an offer could be structured in your market practice — not a contract and not a promise of acceptance.",
          ],
        })
      );
    }
    if (competitiveRisk.level === "high" && (readiness.label === "offer_ready" || readiness.label === "high_offer_intent")) {
      out.push(
        aggr({
          key: "create_urgency_with_market_context",
          title: "Timely, calm follow-up (no market guarantees)",
          priority: "high",
          rationale: [
            "When competition risk is elevated, a timely, factual check-in can help — never invent comparables or guarantee outcomes.",
          ],
        })
      );
    }
    if (hasKey(blockers, "missing_decision_maker")) {
      out.push(
        aggr({
          key: "involve_decision_maker",
          title: "Gently scope who else weighs in",
          priority: "low",
          rationale: ["Avoid last-minute surprises by clarifying who needs to be comfortable, without prying."],
        })
      );
    }
    if (hold) {
      out.push({
        key: "pause_and_nurture",
        title: "Keep touchpoints light and useful",
        priority: "high",
        rationale: ["Nurture trust and information before offer mechanics if resistance would likely grow."],
      });
    } else {
      out.push(
        aggr({
          key: "prepare_soft_offer_conversation",
          title: "Prepare a soft, optional offer talk outline for you",
          priority: "low",
          rationale: ["A short outline in your head or notes can reduce pressure in the actual conversation — still no auto-send here."],
        })
      );
    }
    if ((context.silenceGapDays ?? 0) > 2) {
      out.push(
        aggr({
          key: "follow_up_today",
          title: "Follow up while the thread is fresh",
          priority: "medium",
          rationale: ["A brief, value-add nudge can reduce drift — your schedule and rules apply."],
        })
      );
    }
    if (readiness.label === "discussion_ready" && !out.some((o) => o.key === "propose_offer_discussion")) {
      out.push(
        aggr({
          key: "propose_offer_discussion",
          title: "Test appetite for a how-offers-work chat",
          priority: "low",
          rationale: ["When readiness is mid, a low-stakes process conversation can surface blockers without a hard push."],
        })
      );
    }

    const rank = (p: OfferActionRecommendation["priority"]) => (p === "high" ? 0 : p === "medium" ? 1 : 2);
    out.sort((a, b) => rank(a.priority) - rank(b.priority));
    const dedup: OfferActionRecommendation[] = [];
    const seen = new Set<string>();
    for (const o of out) {
      if (seen.has(o.key)) continue;
      seen.add(o.key);
      dedup.push(o);
    }
    offerStrategyLog.offerActionsRecommended({ n: dedup.length, top: dedup[0]?.key });
    return dedup.slice(0, 10);
  } catch (e) {
    offerStrategyLog.warn("offer_rec_error", { err: e instanceof Error ? e.message : String(e) });
    return [
      {
        key: "pause_and_nurture",
        title: "Review manually",
        priority: "low",
        rationale: ["Heuristics were limited; use your own broker process."],
      },
    ];
  }
}
