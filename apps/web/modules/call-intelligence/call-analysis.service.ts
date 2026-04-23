import type { CallIntelAnalysis } from "./call-intelligence.types";

const POSITIVE = /\b(yes|great|sounds good|interested|let'?s book|perfect|thanks|demo|schedule|works for me)\b/i;
const NEGATIVE = /\b(no|not interested|busy|stop|later|never|cheap|already have|send email only)\b/i;

const OBJECTION_TAGS: { tag: string; pattern: RegExp }[] = [
  { tag: "not_interested", pattern: /\bnot interested\b/i },
  { tag: "busy", pattern: /\b(busy|swamped|no time)\b/i },
  { tag: "already_have_leads", pattern: /\b(already have|enough leads)\b/i },
  { tag: "send_email", pattern: /\b(send (me )?email|email me)\b/i },
  { tag: "price", pattern: /\b(too expensive|price|cost)\b/i },
];

const KEY_PHRASES = [
  "demo",
  "calendar",
  "email",
  "follow up",
  "next week",
  "broker",
  "leads",
  "platform",
];

/**
 * Lightweight transcript analysis — transparent heuristics over keywords (not ML).
 */
export function analyzeTranscript(fullText: string): CallIntelAnalysis {
  const t = fullText.trim();
  if (!t) {
    return {
      sentiment: "neutral",
      objectionsDetected: [],
      keyPhrases: [],
      conversionLikelihood: 0.45,
    };
  }

  const posCount = (t.match(POSITIVE) ?? []).length;
  const negCount = (t.match(NEGATIVE) ?? []).length;
  let sentiment: CallIntelAnalysis["sentiment"] = "neutral";
  if (posCount > negCount + 1) sentiment = "positive";
  else if (negCount > posCount + 1) sentiment = "negative";
  else if (posCount > 0 && negCount > 0) sentiment = "mixed";

  const objectionsDetected: string[] = [];
  for (const { tag, pattern } of OBJECTION_TAGS) {
    if (pattern.test(t)) objectionsDetected.push(tag);
  }

  const keyPhrases = KEY_PHRASES.filter((k) => t.toLowerCase().includes(k));

  let conversionLikelihood = 0.5;
  if (sentiment === "positive") conversionLikelihood += 0.15;
  if (sentiment === "negative") conversionLikelihood -= 0.2;
  conversionLikelihood -= objectionsDetected.length * 0.06;
  conversionLikelihood = Math.min(0.92, Math.max(0.08, conversionLikelihood));

  return {
    sentiment,
    objectionsDetected,
    keyPhrases,
    conversionLikelihood: Math.round(conversionLikelihood * 100) / 100,
  };
}
