/**
 * Bounded inference from taps / minimal inputs — never fabricate certainty.
 */
import { logSeniorAi } from "@/lib/senior-ai/log";
import type { SeniorAiProfileInput, VoiceParseResult } from "./senior-ai.types";

export type IntentSignals = {
  taps?: Record<string, boolean>;
  voiceSnippet?: string | null;
  viewedResidenceIds?: string[];
  clickedCareCategories?: string[];
  budgetChoice?: { min: number; max: number } | null;
  /** Same-session repeat views of same card */
  repeatViews?: number;
};

export function inferMissingNeeds(
  partial: SeniorAiProfileInput,
  signals: IntentSignals,
): { profile: SeniorAiProfileInput; inferredKeys: string[]; confidence: number } {
  const inferredKeys: string[] = [];
  const p: SeniorAiProfileInput = { ...partial };
  let c = partial.budgetMonthly != null && partial.careNeedLevel ? 0.55 : 0.35;

  if (!p.careNeedLevel && signals.taps?.["help_some"]) {
    p.careNeedLevel = "MEDIUM";
    inferredKeys.push("careNeedLevel");
    c += 0.08;
  }
  if (!p.urgencyLevel && (signals.repeatViews ?? 0) >= 3) {
    p.urgencyLevel = "MEDIUM";
    inferredKeys.push("urgencyLevel");
    c += 0.04;
  }
  if (signals.budgetChoice) {
    p.budgetMonthly = (signals.budgetChoice.min + signals.budgetChoice.max) / 2;
    inferredKeys.push("budgetMonthly");
    c += 0.06;
  }
  if (signals.clickedCareCategories?.some((x) => x.toLowerCase().includes("24h"))) {
    if (!p.urgencyLevel) {
      p.urgencyLevel = "MEDIUM";
      inferredKeys.push("urgencyLevel");
    }
  }

  c = Math.min(0.95, c);
  logSeniorAi("[senior-intent]", "infer", { keys: inferredKeys.join(","), conf: c });
  return { profile: p, inferredKeys, confidence: c };
}

/** Lightweight heuristic parser — swap for NLU service when wired. */
export function parseVoiceSnippet(text: string): VoiceParseResult {
  const t = text.trim();
  const lower = t.toLowerCase();
  let preferredCity: string | null = null;
  const cityPatterns = [
    /(?:in|à|at|near)\s+([a-zàâäéèêëïîôùûç\- ]{2,48})/i,
    /([a-zàâäéèêëïîôùûç\- ]{2,40})\s*(?:area|region|région)/i,
  ];
  for (const re of cityPatterns) {
    const m = lower.match(re);
    if (m?.[1]) {
      preferredCity = m[1].trim().replace(/\s+/g, " ").slice(0, 80);
      break;
    }
  }

  let budgetMonthly: number | null = null;
  const bm = lower.match(/\$?\s*(\d{3,5})\s*(?:\$|\/|\s*(?:per|a|mois|month))?/i);
  if (bm?.[1]) budgetMonthly = Number(bm[1]);

  let whoFor: string | null = null;
  if (/(mother|mère|mom|dad|father|père|parent)/i.test(t)) whoFor = "PARENT";

  let careNeedLevel: string | null = null;
  if (/some help|un peu|assistance/i.test(t)) careNeedLevel = "MEDIUM";

  let urgencyLevel: string | null = null;
  if (/soon|urgent|quickly|vite/i.test(t)) urgencyLevel = "HIGH";

  let confidence = 0.35;
  if (preferredCity) confidence += 0.22;
  if (budgetMonthly) confidence += 0.2;
  if (whoFor) confidence += 0.12;

  return {
    preferredCity,
    budgetMonthly,
    whoFor,
    careNeedLevel,
    urgencyLevel,
    confidence: Math.min(0.92, confidence),
  };
}

