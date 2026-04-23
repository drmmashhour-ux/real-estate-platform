import { getNextLine } from "@/modules/call-assistant/call-assistant.service";
import type { CallStage } from "@/modules/call-assistant/call-assistant.types";

import type { FeedbackTag, LiveFeedbackResult, LivePersonaType } from "./live-training.types";

const TOO_LONG_WORDS = 48;
const WEAK_CLOSE = /\b(maybe|might|try|hope|think about|could|possibly)\b/i;
const STRONG_CLOSE = /\b(book|calendar|minutes|today|tomorrow|send (the )?invite|lock)\b/i;
const GOOD_FRAME = /\b(if it helps|fair question|respect your time|two things|here'?s what)\b/i;
const UNCLEAR = /\b(synergy|leverage|world-?class|best in class)\b/i;

function scriptCategoryFor(persona: LivePersonaType): import("@/modules/sales-scripts/sales-script.types").SalesScriptCategory {
  switch (persona) {
    case "aggressive_broker":
    case "driver_broker":
      return "closing_broker";
    case "skeptical_broker":
      return "cold_call_broker";
    case "dominant_investor":
      return "closing_investor";
    case "analytical_investor":
      return "follow_up_investor";
    case "expressive_user":
      return "pitch_investor";
    case "amiable_client":
      return "follow_up_broker";
    default:
      return "cold_call_broker";
  }
}

function audienceFor(persona: LivePersonaType): "BROKER" | "INVESTOR" {
  if (persona === "expressive_user" || persona.endsWith("_investor")) return "INVESTOR";
  return "BROKER";
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function inferStage(text: string): CallStage {
  if (WEAK_CLOSE.test(text) && !STRONG_CLOSE.test(text)) return "closing";
  if (/\?/.test(text)) return "discovery";
  if (/\b(not interested|busy|no thanks)\b/i.test(text)) return "objection";
  return "pitch";
}

/**
 * Instant coaching after each user line — deterministic rules + approved script rewrite.
 */
export function evaluateLiveTurn(
  userMessage: string,
  personaType: LivePersonaType,
  tension: number,
): LiveFeedbackResult {
  const text = userMessage.trim();
  const words = text.split(/\s+/).filter(Boolean).length;

  let score = 72;
  const tags: FeedbackTag[] = [];

  if (words > TOO_LONG_WORDS) {
    tags.push("too_long");
    score -= 14;
  }
  if (words < 6 && text.length > 0) {
    score -= 8;
    tags.push("unclear_value");
  }
  if (WEAK_CLOSE.test(text) && !STRONG_CLOSE.test(text)) {
    tags.push("weak_close");
    score -= 12;
  }
  if (GOOD_FRAME.test(text)) {
    tags.push("good_framing");
    score += 10;
  }
  if (STRONG_CLOSE.test(text)) {
    tags.push("strong_close");
    score += 12;
  }
  if (UNCLEAR.test(text)) {
    tags.push("unclear_value");
    score -= 10;
  }
  if (/\?/.test(text)) {
    tags.push("asks_question");
    score += 8;
  }
  if (tension >= 55 && !/\b(stop|pause|one question|fair)\b/i.test(text)) {
    tags.push("no_control");
    score -= 14;
  }

  score = clamp(score, 28, 96);

  let quickFix = "Tighten the ask — name one proof + one next step.";
  if (tags.includes("too_long")) quickFix = "Cut to two sentences: proof, then calendar ask.";
  if (tags.includes("weak_close")) quickFix = "Replace hedging with a concrete time-bound ask.";
  if (tags.includes("no_control")) quickFix = "You lost control — acknowledge tension, then redirect to a 5-minute demo.";
  if (tags.includes("good_framing")) quickFix = "Keep framing like that — now land the calendar.";
  if (tags.includes("asks_question")) quickFix = "Good — questions control the call; tighten the follow-up ask.";

  const stage = inferStage(text);
  const audience = audienceFor(personaType);
  const cat = scriptCategoryFor(personaType);

  const ideal = getNextLine({
    audience,
    scriptCategory: cat,
    stage,
    scriptContext: { audience },
  });

  const betterVersion =
    ideal.suggested.length > 12 && ideal.suggested.slice(0, 40) !== text.slice(0, 40)
      ? ideal.suggested
      : undefined;

  return {
    score: Math.round(score),
    tags: [...new Set(tags)],
    quickFix,
    betterVersion,
  };
}
