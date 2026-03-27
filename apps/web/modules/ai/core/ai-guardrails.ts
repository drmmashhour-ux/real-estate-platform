/**
 * Global AI safety — never auto-approve legal/financial actions; strip sensitive fields from audit payloads.
 */

import type { AiIntent } from "./types";

export const AI_LEGAL_FINANCIAL_NOTICE =
  "AI suggestions do not replace legal, financial, or professional advice. Confirm all material decisions with qualified professionals.";

const SENSITIVE_KEY = /(password|secret|token|ssn|sin\b|cardnumber|cvv|authorization|bearer)/i;

/** Intents that must never imply automated approval of money or contracts. */
const HIGH_STAKES: AiIntent[] = ["draft", "analyze", "risk"];

export function appendStandardNotice(system: string): string {
  return `${system.trim()}\n\nRules: Do not present yourself as a lawyer, mortgage underwriter, or financial approver. Do not instruct the user to bypass platform checks. Keep answers concise. ${AI_LEGAL_FINANCIAL_NOTICE}`;
}

export function intentRequiresExtraCaution(intent: AiIntent): boolean {
  return HIGH_STAKES.includes(intent);
}

export function assertNoAutoActionLanguage(text: string): string {
  const lower = text.toLowerCase();
  const bad =
    lower.includes("you are approved") ||
    lower.includes("guaranteed approval") ||
    lower.includes("legally binding") && lower.includes("ai");
  if (bad) {
    return `${text}\n\n(Platform note: automated wording was adjusted — verify with qualified professionals.)`;
  }
  return text;
}

/** Redact keys and cap size for prompts + audit `inputSummary`. */
export function sanitizeContext(raw: unknown, maxLen = 8000): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, unknown> = {};
  let budget = maxLen;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (SENSITIVE_KEY.test(k)) {
      out[k] = "[redacted]";
      continue;
    }
    const s = typeof v === "string" ? v.slice(0, 2000) : JSON.stringify(v);
    if (s.length > budget) {
      out[k] = s.slice(0, budget) + "…";
      budget = 0;
      break;
    }
    budget -= s.length;
    out[k] = v;
    if (budget <= 0) break;
  }
  return out;
}

export function summarizeForAudit(obj: Record<string, unknown>, max = 1200): string {
  try {
    const s = JSON.stringify(obj);
    return s.length <= max ? s : s.slice(0, max) + "…";
  } catch {
    return "[unserializable context]";
  }
}
