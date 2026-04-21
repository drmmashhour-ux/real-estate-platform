import { logInfo } from "@/lib/logger";

const TAG = "[conversation-analysis]";

export type SentimentLabel = "POSITIVE" | "NEUTRAL" | "NEGATIVE";

export type SentimentSignals = {
  interest: boolean;
  hesitation: boolean;
  objections: boolean;
};

const POS_RE = /\b(love|interested|yes|great|perfect|visit|offer|ready|excited|like|book|schedule)\b/i;
const NEG_RE = /\b(no|not interested|too expensive|pass|worried|concern|delay|later|hesitat|unsure|problem)\b/i;
const HES_RE = /\b(maybe|think about|not sure|consider|price|budget|compare|wait)\b/i;
const OBJ_RE = /\b(too much|overpriced|condition|fee|repair|risk|hidden)\b/i;

export function detectSentimentFromTexts(texts: string[]): {
  sentiment: SentimentLabel;
  signals: SentimentSignals;
} {
  const blob = texts.join("\n").slice(-8000);
  const interest = POS_RE.test(blob);
  const hesitation = HES_RE.test(blob) || /\b(but|however)\b/i.test(blob);
  const objections = OBJ_RE.test(blob) || NEG_RE.test(blob);

  let score = 0;
  if (interest) score += 2;
  if (hesitation) score -= 1;
  if (objections) score -= 2;
  if (NEG_RE.test(blob)) score -= 2;

  let sentiment: SentimentLabel = "NEUTRAL";
  if (score >= 2) sentiment = "POSITIVE";
  else if (score <= -2) sentiment = "NEGATIVE";

  logInfo(`${TAG} sentiment`, { sentiment, interest, hesitation, objections });

  return {
    sentiment,
    signals: { interest, hesitation, objections },
  };
}
