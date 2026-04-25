import type { DealCloserContext, DealCloserOutput } from "@/modules/deal-closer/deal-closer.types";
import { computeDealClosingReadiness } from "@/modules/deal-closer/closing-readiness.engine";
import { detectCloseBlockers } from "@/modules/deal-closer/close-blocker.engine";
import { recommendNextCloseActions } from "@/modules/deal-closer/next-close-action.engine";
import { computePrematurePushRisk } from "@/modules/deal-closer/premature-push-risk.service";
import { dealCloserLog } from "@/modules/deal-closer/deal-closer-logger";

/**
 * Full broker-side closer pass — all outputs are explainable suggestions.
 */
export function runDealCloser(context: DealCloserContext): DealCloserOutput {
  try {
    const readiness = computeDealClosingReadiness(context);
    const blockers = detectCloseBlockers(context);
    const prematurePushRisk = computePrematurePushRisk(context, readiness, blockers);
    const nextActions = recommendNextCloseActions(context, readiness, blockers, prematurePushRisk);

    const closeStrategy: string[] = [];
    if (blockers[0] && blockers[0]!.key !== "no_strong_blocker" && blockers[0]!.key !== "low_data") {
      closeStrategy.push(`Address “${blockers[0]!.label}” before a strong close push if it still shows up in your own review.`);
    } else {
      closeStrategy.push("No single blocker dominated this pass — pick one next step you can own with the client in front of you.");
    }
    if (prematurePushRisk === "high") {
      closeStrategy.push("Rebuild momentum first; a hard ask right now is more likely to feel out of step with the current signals.");
    } else if (readiness.label === "close_ready" || readiness.label === "high_intent") {
      closeStrategy.push("Readiness is relatively high in this snapshot — a visit- or process-focused close may fit better than a purely price-first push.");
    }
    if (!context.visitScheduled) {
      closeStrategy.push("If a property visit is part of your process, a concrete time window is often a cleaner next step than offer language.");
    } else {
      closeStrategy.push("A visit is already in motion — use follow-up to align on questions or financing workflow as your rules allow.");
    }

    const coachNotes: string[] = [
      "You are always the decision-maker: copy is suggestion-only and never auto-sends.",
      "Avoid implying legal outcomes, tax results, or financing approvals — keep language descriptive and process-oriented.",
    ];
    if (nextActions[0]) {
      coachNotes.push(
        `Consider starting with “${nextActions[0]!.title}” if it lines up with what you already know about the file.`
      );
    }

    dealCloserLog.dealCloserRun({ readiness: readiness.label, nBlockers: blockers.length, pushRisk: prematurePushRisk });
    return {
      readiness,
      blockers,
      nextActions,
      prematurePushRisk,
      closeStrategy: closeStrategy.slice(0, 5),
      coachNotes: coachNotes.slice(0, 6),
    };
  } catch (e) {
    dealCloserLog.warn("deal_closer_error", { err: e instanceof Error ? e.message : String(e) });
    return {
      readiness: { score: 30, label: "not_ready", rationale: ["Engine used a simple fallback."] },
      blockers: [
        {
          key: "low_data",
          label: "Limited data",
          severity: "low",
          rationale: ["The closer pass could not use full context; review the deal in CRM or messaging. Not legal or financial advice."],
        },
      ],
      nextActions: [
        {
          key: "pause_and_nurture",
          title: "Work your manual checklist",
          priority: "low",
          rationale: ["Heuristic service unavailable; proceed with your normal process."],
        },
      ],
      prematurePushRisk: "high",
      closeStrategy: ["Prefer manual review when automation output is limited."],
      coachNotes: ["No automated next step; nothing was sent to the client."],
    };
  }
}
