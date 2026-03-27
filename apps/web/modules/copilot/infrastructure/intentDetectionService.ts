import type { CopilotIntent } from "@prisma/client";
import { CopilotUserIntent } from "@/modules/copilot/domain/copilotIntents";
import type { CopilotConfidence, IntentDetectionResult } from "@/modules/copilot/domain/copilotTypes";

type Rule = { intent: CopilotUserIntent; weight: number; test: (q: string) => boolean };

const RULES: Rule[] = [
  {
    intent: CopilotUserIntent.PORTFOLIO_SUMMARY,
    weight: 5,
    test: (q) =>
      /\b(?:portfolio|watchlist)\b/i.test(q) &&
      /\b(?:summary|changed|week|what|activity|alert)/i.test(q),
  },
  {
    intent: CopilotUserIntent.PORTFOLIO_SUMMARY,
    weight: 4,
    test: (q) => /\b(?:portfolio|watchlist)\b/i.test(q) && /\b(?:how am i|how's my|my saved)/i.test(q),
  },
  {
    intent: CopilotUserIntent.WHY_NOT_SELLING,
    weight: 5,
    test: (q) =>
      /\b(?:not selling|no offers|stale|why isn't|why is my|not moving|stuck)\b/i.test(q) ||
      /\b(?:time on market)\b/i.test(q),
  },
  {
    intent: CopilotUserIntent.PRICING_HELP,
    weight: 5,
    test: (q) =>
      /\b(?:pricing|list price|asking price|overpriced|comps|comparable|appraisal)\b/i.test(q) &&
      !/\bfind\b.*\bdeal/i.test(q),
  },
  {
    intent: CopilotUserIntent.RISK_CHECK,
    weight: 5,
    test: (q) =>
      /\b(?:risk|red flag|scam|safe|danger|how risky)\b/i.test(q) ||
      /\b(?:trust score|risk score)\b/i.test(q),
  },
  {
    intent: CopilotUserIntent.IMPROVE_LISTING,
    weight: 4,
    test: (q) =>
      /\b(?:improve|fix|boost|complete|missing|missing items|verification)\b/i.test(q) &&
      /\b(?:listing|property)\b/i.test(q),
  },
  {
    intent: CopilotUserIntent.PRICING_HELP,
    weight: 3,
    test: (q) => /\b(?:price|pricing|ask)\b/i.test(q) && /\b(?:how much|should i|review)\b/i.test(q),
  },
  {
    intent: CopilotUserIntent.ANALYZE_PROPERTY,
    weight: 5,
    test: (q) =>
      /\b(?:analyze|analysis|score|opportunity|investment score|deal score)\b/i.test(q) &&
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(q),
  },
  {
    intent: CopilotUserIntent.ANALYZE_PROPERTY,
    weight: 5,
    test: (q) =>
      /\b(?:analyze|analysis|this listing|this property)\b/i.test(q) &&
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(q),
  },
  {
    intent: CopilotUserIntent.FIND_DEALS,
    weight: 5,
    test: (q) =>
      /\b(?:find|search|show|list)\b/i.test(q) &&
      /\b(?:deal|deals|listing|property|under|invest)\b/i.test(q),
  },
  {
    intent: CopilotUserIntent.FIND_DEALS,
    weight: 4,
    test: (q) => /\b(?:good deal|under \$|under|cap rate|cash flow)\b/i.test(q),
  },
  {
    intent: CopilotUserIntent.PRICING_HELP,
    weight: 5,
    test: (q) => /\b(?:pricing help|seller pricing|price my)\b/i.test(q),
  },
];

function scoreToConfidence(best: number): CopilotConfidence {
  if (best >= 5) return "high";
  if (best >= 4) return "medium";
  return "low";
}

/**
 * Phase 1: keyword + pattern classifier. Optional LLM path can be added later.
 */
export function detectIntentKeywordOnly(query: string): IntentDetectionResult {
  const q = query.trim();
  let best: CopilotUserIntent = CopilotUserIntent.UNKNOWN;
  let bestScore = 0;

  for (const rule of RULES) {
    if (rule.test(q) && rule.weight > bestScore) {
      bestScore = rule.weight;
      best = rule.intent;
    }
  }

  if (best === CopilotUserIntent.UNKNOWN && /[0-9a-f]{8}-[0-9a-f]{4}/i.test(q)) {
    return {
      intent: CopilotUserIntent.ANALYZE_PROPERTY,
      confidence: "medium",
      method: "keyword",
    };
  }

  if (best === CopilotUserIntent.UNKNOWN && /\b(?:deal|invest|under|laval|montreal|quebec)\b/i.test(q)) {
    return {
      intent: CopilotUserIntent.FIND_DEALS,
      confidence: "low",
      method: "keyword",
    };
  }

  return {
    intent: best,
    confidence: best === CopilotUserIntent.UNKNOWN ? "low" : scoreToConfidence(bestScore),
    method: "keyword",
  };
}

function confidenceToScore(confidence: CopilotConfidence): number {
  switch (confidence) {
    case "high":
      return 0.9;
    case "medium":
      return 0.6;
    case "low":
      return 0.3;
    default:
      return 0;
  }
}

/**
 * Prisma-aligned intent + numeric confidence (0–1) from the keyword classifier only.
 * For optional LLM refinement, use {@link detectIntentWithOptionalLlm} and map its result.
 */
export function detectIntent(query: string): { intent: CopilotIntent; confidence: number } {
  const { intent, confidence } = detectIntentKeywordOnly(query);
  return {
    intent: intent as CopilotIntent,
    confidence: confidenceToScore(confidence),
  };
}

/**
 * Async Prisma `CopilotIntent` only — delegates to the same deterministic keyword rules as
 * {@link detectIntentKeywordOnly} (no LLM). Use {@link detectIntentWithOptionalLlm} inside `runCopilot`.
 */
export async function detectIntentAsync(query: string): Promise<CopilotIntent> {
  const { intent } = detectIntentKeywordOnly(query);
  return intent as CopilotIntent;
}

/** Optional LLM classification — disabled by default; never overrides keyword with lower confidence. */
export async function detectIntentWithOptionalLlm(query: string): Promise<IntentDetectionResult> {
  const keyword = detectIntentKeywordOnly(query);
  if (process.env.COPILOT_INTENT_LLM_ENABLED !== "true") {
    return keyword;
  }
  const llm = await tryClassifyIntentLlm(query);
  if (llm && llm.confidence === "high" && keyword.confidence !== "high") {
    return { ...llm, method: "llm" };
  }
  return keyword;
}

async function tryClassifyIntentLlm(_query: string): Promise<IntentDetectionResult | null> {
  /* Reserved: call hosted classifier with strict JSON schema; must return CopilotUserIntent only. */
  return null;
}
