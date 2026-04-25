import type { OfferBlocker, OfferStrategyContext } from "@/modules/offer-strategy/offer-strategy.types";
import { offerStrategyLog } from "@/modules/offer-strategy/offer-strategy-logger";

function types(ctx: OfferStrategyContext) {
  const raw = ctx.objections;
  const out: { type: string; severity: string }[] = [];
  if (raw && typeof raw === "object" && "objections" in raw) {
    const arr = (raw as { objections?: { type?: string; severity?: string }[] }).objections;
    if (Array.isArray(arr)) for (const o of arr) if (o?.type) out.push({ type: o.type, severity: o.severity ?? "medium" });
  }
  return out;
}

function has(t: string, ctx: OfferStrategyContext) {
  return types(ctx).some((x) => x.type === t);
}

/**
 * Blockers to offer/negotiation flow — explainable, not auto-fixes.
 */
export function detectOfferBlockers(context: OfferStrategyContext): OfferBlocker[] {
  try {
    const b: OfferBlocker[] = [];
    const fin = context.financingReadiness ?? "unknown";
    if (fin === "weak" || (fin === "unknown" && has("financing", context))) {
      b.push({
        key: "financing_uncertainty",
        label: "Financing path unclear (workflow signal)",
        severity: fin === "weak" ? "high" : "medium",
        rationale: [
          "Clarify process steps the client can take with a lender or mortgage pro — not rates, approvals, or guarantees in chat.",
        ],
      });
    }
    if (has("price", context)) {
      b.push({
        key: "unresolved_price_objection",
        label: "Price / value tension",
        severity: "high",
        rationale: ["Work value and inclusions in your own professional style before numeric offers in messaging."],
      });
    }
    if (has("property_fit", context)) {
      b.push({
        key: "weak_property_fit",
        label: "Property fit not locked",
        severity: "medium",
        rationale: ["Confirm fit, layout, and must-haves before offer mechanics feel grounded."],
      });
    }
    if (has("trust", context) || context.trustLevel === "low") {
      b.push({
        key: "trust_gap",
        label: "Trust / clarity",
        severity: "high",
        rationale: ["Trust gaps often rise with pressure; keep next steps explicit and verifiable on your side."],
      });
    }
    if (context.visitCompleted !== true) {
      b.push({
        key: "no_visit_completed",
        label: "No completed visit in context",
        severity: context.visitScheduled ? "low" : "medium",
        rationale: [
          "If your process expects a visit first, the context does not show visit completed — your CRM may differ.",
        ],
      });
    }
    if (has("timing", context)) {
      b.push({
        key: "timing_hesitation",
        label: "Timing / life cadence",
        severity: "medium",
        rationale: ["Align on dates and constraints before offer structure talk."],
      });
    }
    if (/spouse|partner|parent|decide together|need to ask/i.test(JSON.stringify(context.clientMemory ?? ""))) {
      b.push({
        key: "missing_decision_maker",
        label: "Possible other decision input",
        severity: "low",
        rationale: ["Heuristic from memory text — not a claim about the client’s household."],
      });
    }
    if ((context.silenceGapDays ?? 0) > 3) {
      b.push({
        key: "silence_gap",
        label: "Thread quiet",
        severity: (context.silenceGapDays ?? 0) > 7 ? "high" : "medium",
        rationale: ["Re-engage before offer mechanics if the relationship temperature has dropped."],
      });
    }
    if (context.urgencyLevel === "low" && (context.engagementScore ?? 50) < 50) {
      b.push({
        key: "insufficient_urgency",
        label: "Low momentum / urgency read",
        severity: "medium",
        rationale: ["A softer sequence may beat a formal offer nudge when energy is low — your read leads."],
      });
    }
    if (/fear|worried|nervous|scared|commit/i.test(JSON.stringify(context.clientMemory ?? "")) || context.hesitationOrComparisonHint) {
      b.push({
        key: "negotiation_fear",
        label: "Hesitation about commitment",
        severity: "low",
        rationale: ["Use supportive, non-judgmental language — this tool does not diagnose people."],
      });
    }
    if (b.length === 0) {
      b.push({
        key: "no_dominant_blocker",
        label: "No single dominant blocker in this pass",
        severity: "low",
        rationale: ["Sparse or neutral data — your notes and compliance process still lead."],
      });
    }
    b.sort((a, b) => {
      const r = (s: OfferBlocker["severity"]) => (s === "high" ? 0 : s === "medium" ? 1 : 2);
      return r(a.severity) - r(b.severity);
    });
    offerStrategyLog.offerBlockersDetected({ n: b.length, keys: b.map((x) => x.key) });
    return b.slice(0, 12);
  } catch (e) {
    offerStrategyLog.warn("offer_blocker_error", { err: e instanceof Error ? e.message : String(e) });
    return [
      {
        key: "low_data",
        label: "Limited context",
        severity: "low",
        rationale: ["Could not load rich signals; avoid relying on this pass alone."],
      },
    ];
  }
}
