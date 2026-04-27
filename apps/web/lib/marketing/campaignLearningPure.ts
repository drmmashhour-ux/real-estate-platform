/**
 * Order 87 — pattern extraction and classification (no I/O, safe for client/tests).
 */

const URGENCY = /\b(urgent|today|now|limited|hurry|last chance|act now|don't miss)\b/i;
const TRUST = /\b(secure|trusted|safe|guarantee|verified|reliable|peace of mind|protected)\b/i;
const VALUE = /\b(save|savings|deal|deals|free|discount|off\b|\%|lowest|affordable|bonus|cash back)\b/i;

const WIN_MIN_CTR = 0.03;
const WIN_MIN_CVR = 0.05;
const WIN_MIN_N = 3;
const WEAK_MAX_CTR = 0.015;

export function extractPatternFromCopy(headline: string, body: string, platform: string): string {
  const p = platform.toLowerCase();
  if (URGENCY.test(headline)) {
    return "urgency-driven headline";
  }
  if (TRUST.test(body)) {
    return "trust-focused copy";
  }
  if (VALUE.test(body)) {
    return "value-focused copy";
  }
  if (p === "tiktok" && headline.trim().endsWith("?")) {
    return "question-based hook";
  }
  return "general marketplace copy";
}

export function order87ClassifyGroup(n: number, avgCtr: number, avgCvr: number): "win" | "weak" | "neutral" {
  if (n < WIN_MIN_N) {
    return "neutral";
  }
  if (avgCtr >= WIN_MIN_CTR && avgCvr >= WIN_MIN_CVR) {
    return "win";
  }
  if (avgCtr < WEAK_MAX_CTR) {
    return "weak";
  }
  return "neutral";
}
