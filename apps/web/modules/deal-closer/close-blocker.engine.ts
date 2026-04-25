import type { DealCloserContext, CloseBlocker } from "@/modules/deal-closer/deal-closer.types";
import { dealCloserLog } from "@/modules/deal-closer/deal-closer-logger";

type Obj = { type?: string; severity?: string; confidence?: number };

/**
 * Maps context + objection list to explainable blockers. No automatic actions.
 */
export function detectCloseBlockers(context: DealCloserContext): CloseBlocker[] {
  try {
    const out: CloseBlocker[] = [];
    const objections = parseObjections(context);
    const byType = (t: string) => objections.find((o) => o.type === t);

    const price = byType("price");
    if (price && (price.severity !== "low" || (price.confidence ?? 0) >= 0.45)) {
      out.push({
        key: "unresolved_price_objection",
        label: "Price / value tension",
        severity: price.severity === "high" ? "high" : "medium",
        rationale: [
          "A price-related concern was heuristically detected from recent text or memory.",
          "Common next step: align on inclusions, comparables, and budget comfort in your own professional judgment — not automated advice.",
        ],
      });
    }
    const finWeak = context.financingReadiness === "weak";
    const finUnk = context.financingReadiness === "unknown" || context.financingReadiness == null;
    if (byType("financing") || finWeak || (finUnk && (context.silenceGapDays ?? 0) > 3)) {
      const sev: CloseBlocker["severity"] = finWeak ? "high" : byType("financing") ? "medium" : "low";
      out.push({
        key: "financing_uncertainty",
        label: "Financing path not clear (workflow signal)",
        severity: sev,
        rationale: [
          "This is a process indicator only — not a credit decision or rate promise.",
          "Many brokers confirm pre-qualification or next step with a lender as a human step.",
        ],
      });
    }
    if (byType("trust")) {
      out.push({
        key: "trust_gap",
        label: "Trust / transparency",
        severity: "high",
        rationale: [
          "Trust language appeared in the keyword pass; rebuild clarity before a close push.",
        ],
      });
    }
    if (context.visitScheduled !== true) {
      const stage = (context.dealStage ?? "").toLowerCase();
      if (!stage.includes("visit") && !stage.includes("ready") && (context.engagementScore ?? 0) > 45) {
        out.push({
          key: "no_visit_yet",
          label: "No visit on record (in this context)",
          severity: "medium",
          rationale: [
            "If a property visit is part of your process, the context did not show a scheduled visit flag.",
            "Heuristic only — your CRM may already have a visit outside this system.",
          ],
        });
      }
    }
    if (byType("property_fit")) {
      out.push({
        key: "weak_property_fit",
        label: "Property fit / layout",
        severity: "medium",
        rationale: ["Fit or layout concerns can block a clean close until alternatives or trade-offs are clear."],
      });
    }
    if (byType("timing")) {
      out.push({
        key: "timing_hesitation",
        label: "Timing / life cadence",
        severity: "medium",
        rationale: ["Timing tension often needs a date conversation before offer mechanics."],
      });
    }
    if ((context.engagementScore ?? 100) < 35) {
      out.push({
        key: "low_engagement",
        label: "Low engagement signal",
        severity: "high",
        rationale: ["Engagement read is soft — a nurture or re-engage pass may come before a close ask."],
      });
    }
    if ((context.silenceGapDays ?? 0) > 5) {
      out.push({
        key: "long_silence",
        label: "Long silence window",
        severity: "high",
        rationale: [
          `About ${context.silenceGapDays} days without activity in this read — confirm before assuming intent.`,
        ],
      });
    }
    if (byType("competition")) {
      out.push({
        key: "competing_options",
        label: "Alternatives / competition",
        severity: "medium",
        rationale: ["The client may be comparing options; clarify differentiators without disparagement."],
      });
    }
    if (/decision|spouse|partner|committee/i.test(JSON.stringify(context.conversationInsights ?? ""))) {
      out.push({
        key: "missing_decision_maker",
        label: "Possible other decision voice",
        severity: "low",
        rationale: [
          "Text hinted at another stakeholder — confirm who needs to align (heuristic, not a claim about people).",
        ],
      });
    }

    if (out.length === 0) {
      out.push({
        key: "no_strong_blocker",
        label: "No single dominant blocker from this pass",
        severity: "low",
        rationale: [
          "Data was sparse or neutral — your field notes and compliance review still lead.",
        ],
      });
    }

    out.sort((a, b) => {
      const rank = (s: CloseBlocker["severity"]) => (s === "high" ? 0 : s === "medium" ? 1 : 2);
      return rank(a.severity) - rank(b.severity);
    });
    dealCloserLog.closeBlockersDetected({ n: out.length, keys: out.map((b) => b.key) });
    return out.slice(0, 12);
  } catch (e) {
    dealCloserLog.warn("close_blocker_error", { err: e instanceof Error ? e.message : String(e) });
    return [
      {
        key: "low_data",
        label: "Limited context",
        severity: "low",
        rationale: ["Heuristic pass could not load rich signals — review manually before a close plan."],
      },
    ];
  }
}

function parseObjections(ctx: DealCloserContext): Obj[] {
  const raw = ctx.objections;
  if (raw && typeof raw === "object" && "objections" in raw) {
    const arr = (raw as { objections?: Obj[] }).objections;
    if (Array.isArray(arr)) return arr;
  }
  return [];
}
