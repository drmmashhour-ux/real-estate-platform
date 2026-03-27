import { scoreLead, type LeadScoreResult } from "@/lib/ai/lead-scoring";

export type ImmoSmartAnswers = {
  buyingSoon?: string;
  budgetRange?: string;
  preApproved?: string;
};

/**
 * Merge optional message + smart answers into text for scoring, then apply Immo bonuses.
 */
export function scoreImmoLead(params: {
  name: string;
  email: string;
  phone: string;
  message: string;
  smart: ImmoSmartAnswers;
}): LeadScoreResult {
  const parts = [params.message.trim()];
  if (params.smart.buyingSoon) parts.push(`Timeline: ${params.smart.buyingSoon}`);
  if (params.smart.budgetRange) parts.push(`Budget: ${params.smart.budgetRange}`);
  if (params.smart.preApproved) parts.push(`Pre-approved: ${params.smart.preApproved}`);
  const combined = parts.filter(Boolean).join("\n");

  const base = scoreLead({
    name: params.name,
    email: params.email,
    phone: params.phone,
    message: combined || params.message,
  });

  let score = base.score;
  const extra: string[] = [];

  const soon = params.smart.buyingSoon ?? "";
  if (soon === "within_30d" || soon === "asap") {
    score = Math.min(100, score + 14);
    extra.push("Buying soon (≤30d)");
  } else if (soon === "1_3mo") {
    score = Math.min(100, score + 8);
    extra.push("Timeline 1–3 months");
  }

  const pre = params.smart.preApproved ?? "";
  if (pre === "yes") {
    score = Math.min(100, score + 12);
    extra.push("Pre-approved / financing ready");
  }

  const budget = params.smart.budgetRange ?? "";
  if (budget && budget !== "not_sure") {
    score = Math.min(100, score + 6);
    extra.push("Budget range provided");
  }

  const temperature: LeadScoreResult["temperature"] =
    score >= 80 ? "hot" : score >= 50 ? "warm" : "cold";

  const explanation =
    extra.length > 0 ? `${base.explanation} · ${extra.join(". ")}` : base.explanation;

  return { score, temperature, explanation };
}
