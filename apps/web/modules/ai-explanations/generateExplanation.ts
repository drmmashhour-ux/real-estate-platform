import OpenAI from "openai";
import { logError } from "@/lib/logger";
import type { TrustScoreResult } from "@/modules/trust-score/domain/trustScore.types";
import type { DealScoreResult } from "@/modules/deal-score/domain/dealScore.types";

export type DecisionExplanation = {
  summary: string;
  keyInsights: string[];
  warnings: string[];
  nextActions: string[];
  /** True when OpenAI was used for the summary only */
  aiEnhanced: boolean;
};

function buildDeterministicExplanation(
  trust: TrustScoreResult,
  deal: DealScoreResult,
  extraIssues: string[]
): DecisionExplanation {
  const keyInsights: string[] = [
    `Trust ${trust.trustScore}/100 (raw ${trust.trustScoreRaw}, confidence ${trust.trustConfidence}/100) — ${trust.level}.`,
    `Deal ${deal.dealScore}/100 (confidence ${deal.dealConfidence}/100) — ${deal.category}; not an appraisal.`,
  ];
  const warnings: string[] = [
    ...trust.issues.slice(0, 4),
    ...(deal.riskScore >= 60 ? [`Risk score is elevated (${deal.riskScore}/100) — review assumptions.`] : []),
    ...(deal.dealConfidence < 45 ? [`Deal confidence is low (${deal.dealConfidence}/100) — limited data for a strong call.`] : []),
    ...(deal.warnings ?? []).slice(0, 4),
    ...extraIssues,
  ];
  const nextActions: string[] = [];
  if (trust.issues.length) nextActions.push("Address trust gaps: photos, verification, and declaration completeness.");
  if (deal.recommendation === "avoid") nextActions.push("Revisit price, rent assumptions, or financing before committing.");
  else if (deal.recommendation === "strong_opportunity")
    nextActions.push("Still verify with a licensed professional before offering.");
  else if (deal.recommendation === "insufficient_data")
    nextActions.push("Add comparables and complete listing data before relying on the score.");
  else nextActions.push("Review comparables and financing with your own advisors.");

  const summary = `This property scores ${trust.trustScore}/100 on trust (${trust.level}, confidence ${trust.trustConfidence}/100) and ${deal.dealScore}/100 on the deal (${deal.category}, confidence ${deal.dealConfidence}/100). ${
    trust.issues.length
      ? "Listing quality gaps reduce confidence."
      : "Listing signals are reasonably complete."
  } ${deal.riskScore >= 55 ? "Risk is on the higher side for this model." : "Risk sits within the modeled band."}`;

  return {
    summary,
    keyInsights,
    warnings: [...new Set(warnings)].slice(0, 8),
    nextActions,
    aiEnhanced: false,
  };
}

/**
 * Deterministic explanation first; optional OpenAI Responses API for tighter prose (never overrides scores).
 */
export async function generateExplanation(args: {
  trust: TrustScoreResult;
  deal: DealScoreResult;
  /** Optional extra strings (e.g. analyzer warnings) */
  extraWarnings?: string[];
}): Promise<DecisionExplanation> {
  const base = buildDeterministicExplanation(args.trust, args.deal, args.extraWarnings ?? []);

  if (process.env.DECISION_ENGINE_USE_OPENAI !== "true") {
    return base;
  }
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return base;

  const model = process.env.DECISION_ENGINE_OPENAI_MODEL?.trim() || "gpt-4.1-mini";
  const client = new OpenAI({ apiKey: key });

  const payload = {
    trustScore: args.trust.trustScore,
    trustLevel: args.trust.level,
    trustConfidence: args.trust.trustConfidence,
    trustIssues: args.trust.issues,
    trustStrengths: args.trust.strengths,
    dealScore: args.deal.dealScore,
    dealCategory: args.deal.category,
    dealConfidence: args.deal.dealConfidence,
    dealRecommendation: args.deal.recommendation,
    riskScore: args.deal.riskScore,
  };

  try {
    const res = await client.responses.create({
      model,
      input: [
        {
          role: "system",
          content:
            "You explain pre-computed real-estate scores only. Never invent numbers, legal facts, or guarantees. " +
            "Write one concise paragraph (max 90 words). Do not contradict the JSON values.",
        },
        {
          role: "user",
          content: `Data (JSON):\n${JSON.stringify(payload)}`,
        },
      ],
    });
    const text = res.output_text?.trim();
    if (text && text.length > 20) {
      return {
        ...base,
        summary: text.slice(0, 2000),
        aiEnhanced: true,
      };
    }
  } catch (e) {
    logError("Decision engine OpenAI explanation failed", e);
  }

  return base;
}
