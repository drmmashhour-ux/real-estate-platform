import { portfolioIntelLog } from "./brokerage-intelligence-logger";
import type { DealPriorityResult, DealPortfolioSlice } from "./brokerage-intelligence.types";
import { buildPortfolioContextBucketForDeal } from "./context.service";

const CLOSING = new Set([
  "financing",
  "closing_scheduled",
  "closing",
  "inspection",
  "accepted",
  "offer_submitted",
]);

const RISKY = new Set(["initiated", "CONFLICT_REQUIRES_DISCLOSURE", "CONFLICT", "contested", "on-hold", "on_hold", "on-hold / review"]);

function levelFrom(n: number): "low" | "medium" | "high" {
  if (n < 0.35) return "low";
  if (n < 0.7) return "medium";
  return "high";
}

/**
 * 0–100 product priority; explainable, not a promise of close.
 */
export function computeDealPriority(deal: DealPortfolioSlice): DealPriorityResult {
  const rationale: string[] = [];
  try {
    const price = Math.max(0, deal.priceCents);
    const valueK = 30 + Math.min(30, (Math.log10(price + 1) - 3) * 6);
    const stage = (deal.crmStage ?? deal.status).toLowerCase();
    const closingBoost = Array.from(CLOSING).some((c) => stage.includes(c) || (deal.status ?? "").toLowerCase().includes(c))
      ? 22
      : 0;
    const st = (deal.status ?? "").toLowerCase();
    if (RISKY.has(st) || RISKY.has(deal.crmStage ?? "")) {
      rationale.push("Risk: conflict / hold or sensitive pipeline stage in snapshot.");
    }
    const timeIdleMs = Date.now() - deal.lastUpdatedAt.getTime();
    const daysIdle = timeIdleMs / (1000 * 60 * 60 * 24);
    const silence = typeof deal.silenceGapDays === "number" ? deal.silenceGapDays : Math.min(21, daysIdle);
    const silencePenalty = Math.min(20, Math.max(0, silence) * 1.1);
    const pClose = deal.closeProbHint;
    const probK = (typeof pClose === "number" && pClose > 0 ? pClose * 25 : 10) + 5;
    let raw = valueK * 0.4 + (closingBoost + probK) * 0.35 - silencePenalty * 0.25;
    const bounded = Math.max(0, Math.min(100, Math.round(raw)));
    const riskN =
      (RISKY.has(st) ? 0.8 : 0) +
      (deal.status?.toLowerCase() === "cancelled" ? 0.2 : 0) +
      (timeIdleMs > 7 * 864e5 ? 0.15 : 0);
    const urN = silence > 5 ? 0.75 : silence > 1 ? 0.45 : 0.2;
    const riskLevel = levelFrom(riskN);
    const urgencyLevel = levelFrom(urN);
    if (valueK > 45) rationale.push("Higher ticket size increases portfolio attention score (heuristic, not a judgment).");
    if (closingBoost) rationale.push("Close-stage pipeline: prioritization to avoid stalls.");
    if (silence > 1) rationale.push(`Silence/idle: ~${silence.toFixed(0)}d — review cadence, not a character assessment.`);
    portfolioIntelLog.dealPriority({ id: deal.id, score: bounded, risk: riskLevel, urgency: urgencyLevel });
    return {
      priorityScore: bounded,
      urgencyLevel,
      riskLevel,
      rationale: [...rationale, `Context bucket: ${buildPortfolioContextBucketForDeal(deal).slice(0, 100)}`],
    };
  } catch (e) {
    portfolioIntelLog.warn("computeDealPriority", { err: e instanceof Error ? e.message : String(e) });
    return {
      priorityScore: 40,
      urgencyLevel: "medium",
      riskLevel: "medium",
      rationale: ["Heuristic failed; default medium priority; manual review."],
    };
  }
}
