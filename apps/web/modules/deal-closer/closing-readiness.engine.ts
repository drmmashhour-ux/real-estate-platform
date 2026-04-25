import type { DealCloserContext, ClosingReadinessResult } from "@/modules/deal-closer/deal-closer.types";
import { dealCloserLog } from "@/modules/deal-closer/deal-closer-logger";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

/**
 * Deterministic 0–100 score. Heuristic only — not a promise of closing.
 */
export function computeDealClosingReadiness(context: DealCloserContext): ClosingReadinessResult {
  try {
    const rationale: string[] = [];
    let score = 42;
    const eng = context.engagementScore;
    const dealP = context.dealProbability;
    if (eng != null) {
      score += clamp((eng - 50) * 0.35, -18, 22);
      rationale.push(`Engagement-style score from context (~${eng}): treated as one signal among many, not a verdict.`);
    }
    if (dealP != null) {
      score += clamp((dealP - 50) * 0.25, -12, 15);
      rationale.push(`Deal-probability style read (~${dealP}): informational for broker workflow, not a guarantee.`);
    }
    if (context.visitScheduled === true) {
      score += 14;
      rationale.push("A visit is on the calendar — often a positive next-step signal in the pipeline (verify in your CRM).");
    }
    if (context.offerDiscussed === true) {
      score += 10;
      rationale.push("Offer or terms were discussed — later-funnel signal if that matches your notes.");
    }
    if (context.urgencyLevel === "high") {
      score += 6;
      rationale.push("Follow-up energy in context reads as higher — still confirm with the client directly.");
    } else if (context.urgencyLevel === "low") {
      score -= 8;
      rationale.push("Lower implied follow-up energy — a softer cadence may fit until intent clarifies.");
    }
    const fin = context.financingReadiness ?? "unknown";
    if (fin === "strong") {
      score += 10;
      rationale.push("Financing readiness hint: stronger (product signal only — not an approval or credit assessment).");
    } else if (fin === "weak") {
      score -= 14;
      rationale.push("Financing readiness hint: weaker — many deals need clarity here before a hard close push.");
    } else if (fin === "medium") {
      score += 2;
    }

    const obs = extractObjectionTypes(context);
    if (obs.has("price") && obs.hasHighPrice) {
      score -= 16;
      rationale.push("Unresolved price tension is a common close brake — align on value before a final push.");
    }
    if (obs.has("trust")) {
      score -= 12;
      rationale.push("Trust or transparency concerns reduce close comfort — address with clear, factual follow-up.");
    }
    if (obs.has("timing")) {
      score -= 6;
      rationale.push("Timing hesitation may need a timeline check-in rather than an offer push.");
    }
    if (obs.has("competition")) {
      score -= 5;
      rationale.push("Competition or alternatives mentioned — clarify fit and next step without pressure.");
    }

    const gap = context.silenceGapDays;
    if (gap != null && gap > 4) {
      score -= Math.min(24, 4 + gap * 2);
      rationale.push(`Silence gap ~${gap}d — momentum may need repair before a close-oriented message.`);
    } else if (gap != null && gap <= 1) {
      score += 4;
      rationale.push("Recent message activity — thread may be warm enough for a structured next step if blockers are low.");
    }

    const status = (context.dealStatus ?? "").toLowerCase();
    if (status.includes("closing") || status.includes("accepted") || status.includes("financing")) {
      score += 8;
      rationale.push("Deal status in CRM suggests a later stage — still match tone to your compliance workflow.");
    }
    if (status === "initiated" || status === "cancelled") {
      score -= 6;
      rationale.push("Early or closed status in CRM — calibrate expectations vs. close language.");
    }

    score = Math.round(clamp(score, 0, 100));
    let label: ClosingReadinessResult["label"] = "warming_up";
    if (score <= 34) label = "not_ready";
    else if (score <= 59) label = "warming_up";
    else if (score <= 79) label = "close_ready";
    else label = "high_intent";

    if (rationale.length > 6) rationale.splice(4, rationale.length - 4, "…additional factors folded into score without over-claiming.");

    dealCloserLog.closingReadinessComputed({ score, label });
    return { score, label, rationale: rationale.slice(0, 8) };
  } catch (e) {
    dealCloserLog.warn("closing_readiness_error", { err: e instanceof Error ? e.message : String(e) });
    return {
      score: 40,
      label: "warming_up",
      rationale: ["Heuristic fallback — review the deal manually; this is not financial or legal advice."],
    };
  }
}

function extractObjectionTypes(ctx: DealCloserContext): { has: (k: string) => boolean; hasHighPrice: boolean } {
  const raw = ctx.objections;
  const types = new Set<string>();
  let highPrice = false;
  if (raw && typeof raw === "object" && "objections" in raw) {
    const arr = (raw as { objections?: { type?: string; severity?: string }[] }).objections;
    if (Array.isArray(arr)) {
      for (const o of arr) {
        if (o?.type) types.add(String(o.type));
        if (o?.type === "price" && o?.severity === "high") highPrice = true;
      }
    }
  }
  return { has: (k) => types.has(k), hasHighPrice: highPrice };
}
