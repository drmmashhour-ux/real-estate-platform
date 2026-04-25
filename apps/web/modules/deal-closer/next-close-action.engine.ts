import type { DealCloserContext, NextCloseAction, CloseBlocker, ClosingReadinessResult } from "@/modules/deal-closer/deal-closer.types";
import type { PrematurePushLevel } from "@/modules/deal-closer/premature-push-risk.service";
import { dealCloserLog } from "@/modules/deal-closer/deal-closer-logger";

/**
 * Ranked suggestions only — never executed automatically.
 */
export function recommendNextCloseActions(
  context: DealCloserContext,
  readiness: ClosingReadinessResult,
  blockers: CloseBlocker[],
  prematurePushRisk: PrematurePushLevel
): NextCloseAction[] {
  try {
    const has = (k: string) => blockers.some((b) => b.key === k);
    const highBlock = blockers.filter((b) => b.severity === "high").map((b) => b.key);
    const deprioritizeClose = prematurePushRisk === "high";

    const pool: NextCloseAction[] = [];

    if (has("unresolved_price_objection") || has("competing_options")) {
      pool.push({
        key: "resolve_price_objection",
        title: "Clarify value and price fit",
        priority: "high",
        rationale: [
          "A price or competition signal is present — address it with facts and options you can stand behind (suggestion only).",
        ],
        suggestedApproach: "Summarize what is included, align on one comparison frame, and invite the client to name their comfort band — you choose wording.",
        suggestedMessageGoal: "objection_handling",
        blockedIf: highBlock.length ? ["unresolved_price_objection"] : undefined,
      });
    }

    if (has("financing_uncertainty")) {
      pool.push({
        key: "clarify_financing",
        title: "Clarify next financing step (process, not rates)",
        priority: "high",
        rationale: [
          "Confirm what the client has already done and what the next human step is — not a rate or approval claim.",
        ],
        suggestedApproach: "Offer a short checklist: lender contact, documents, timing — as general workflow help.",
        suggestedMessageGoal: "qualification_followup",
        blockedIf: ["financing_uncertainty"],
      });
    }

    if (has("trust_gap")) {
      pool.push({
        key: "re_engage_client",
        title: "Rebuild clarity and trust",
        priority: "high",
        rationale: ["Trust blockers are high-friction; a transparent, no-surprises tone usually helps before a close ask."],
        suggestedApproach: "One clear fact, one question, one optional next step — your professional style.",
        suggestedMessageGoal: "re_engagement",
      });
    }

    if (context.visitScheduled !== true) {
      pool.push({
        key: "schedule_visit",
        title: "Propose a concrete visit or walkthrough",
        priority: readiness.label === "close_ready" || readiness.label === "high_intent" ? "high" : "medium",
        rationale: [
          "If a visit fits your process, scheduling can move from abstract interest to a shared experience of the property.",
        ],
        suggestedApproach: "Offer two time windows; never imply access you have not confirmed.",
        suggestedMessageGoal: "visit_scheduling",
      });
    }

    if (has("weak_property_fit")) {
      pool.push({
        key: "recommend_better_fit_listings",
        title: "Offer better-fit alternatives (if you have them)",
        priority: "medium",
        rationale: ["If fit is the issue, a short list of alternatives can protect the relationship and the close path."],
        suggestedApproach: "Share 1–2 matches with a single sentence on why each could work — no guarantee language.",
        suggestedMessageGoal: "objection_handling",
      });
    }

    if (has("long_silence") || has("low_engagement")) {
      pool.push({
        key: "re_engage_client",
        title: "Re-open the thread gently",
        priority: "high",
        rationale: ["Silence or low engagement often needs momentum before a closing-style line."],
        suggestedMessageGoal: "re_engagement",
      });
    }

    if (readiness.label === "close_ready" || readiness.label === "high_intent") {
      if (!deprioritizeClose) {
        pool.push({
          key: "propose_offer_discussion",
          title: "Move to a structured offer discussion (wording only)",
          priority: "medium",
          rationale: [
            "Readiness is higher in this pass — a broker-led conversation about offer structure may fit if blockers are addressed.",
            "This is not an instruction to file an offer; it is a conversation prompt for you to use or ignore.",
          ],
          suggestedMessageGoal: "closing_nudge",
          blockedIf: highBlock,
        });
      } else {
        pool.push({
          key: "pause_and_nurture",
          title: "Hold the hard close; nurture first",
          priority: "high",
          rationale: [
            "Premature-push risk is elevated — prefer one clarifying or trust step before offer language.",
          ],
          suggestedMessageGoal: "re_engagement",
        });
      }
    }

    pool.push({
      key: "confirm_decision_timeline",
      title: "Confirm timeline and decision process",
      priority: "low",
      rationale: ["A simple timeline question can reduce false urgency and surface hidden blockers."],
      suggestedMessageGoal: "qualification_followup",
    });

    if (has("missing_decision_maker")) {
      pool.push({
        key: "involve_decision_maker",
        title: "Clarify who else needs to align",
        priority: "low",
        rationale: ["If others are in the decision, a polite scope question can prevent last-minute stalls."],
        suggestedMessageGoal: "qualification_followup",
      });
    }

    if (readiness.label === "not_ready" && !deprioritizeClose) {
      pool.push({
        key: "pause_and_nurture",
        title: "Keep touchpoints light until readiness rises",
        priority: "medium",
        rationale: ["Readiness is low in this pass — a nurture cadence can outperform a push."],
        suggestedMessageGoal: "re_engagement",
      });
    }

    const rank = (a: NextCloseAction) => {
      const p = a.priority === "high" ? 0 : a.priority === "medium" ? 1 : 2;
      if (deprioritizeClose && (a.key === "propose_offer_discussion" || a.suggestedMessageGoal === "closing_nudge")) {
        return p + 4;
      }
      if (a.key === "schedule_visit" && (readiness.label === "high_intent" || readiness.label === "close_ready")) {
        return p - 0.2;
      }
      return p;
    };
    pool.sort((a, b) => rank(a) - rank(b));

    if (context.offerDiscussed === true && !deprioritizeClose) {
      const nego = pool.find((x) => x.key === "propose_offer_discussion");
      if (nego) nego.priority = "high";
    }

    const out = pool.filter((a, i, arr) => i === arr.findIndex((b) => b.key === a.key));
    dealCloserLog.nextCloseActionsRecommended({ n: out.length, top: out[0]?.key });
    return out.slice(0, 10);
  } catch (e) {
    dealCloserLog.warn("next_close_error", { err: e instanceof Error ? e.message : String(e) });
    return [
      {
        key: "pause_and_nurture",
        title: "Review the deal manually",
        priority: "low",
        rationale: ["Heuristics were limited; use your own playbook before a close plan."],
      },
    ];
  }
}
