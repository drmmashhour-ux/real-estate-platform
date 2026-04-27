import { EARLY_USER_CAP } from "@/lib/growth/earlyUserConstants";

/**
 * Pure early-cohort copy + counts (Order 45). No DB — safe for unit tests and bundlers that must not load SQL.
 */
export type EarlyUserSignals = {
  count: number;
  remaining: number;
  isEarlyPhase: boolean;
  message: string;
};

/**
 * Pure helper for unit tests and API serialization.
 * When `count > 100`, `message` is empty — hide scarcity / early-access urgency (safety).
 */
export function buildEarlyUserSignalsFromCount(count: number): EarlyUserSignals {
  const n = Math.max(0, Math.floor(count));
  const remaining = Math.max(0, EARLY_USER_CAP - n);
  const isEarlyPhase = n < EARLY_USER_CAP;

  if (n > EARLY_USER_CAP) {
    return { count: n, remaining, isEarlyPhase: false, message: "" };
  }
  if (n < 50) {
    return { count: n, remaining, isEarlyPhase, message: `Be among the first ${EARLY_USER_CAP} users` };
  }
  if (n < EARLY_USER_CAP) {
    return {
      count: n,
      remaining,
      isEarlyPhase,
      message: `Only ${remaining} spots left for early access`,
    };
  }
  return {
    count: n,
    remaining: 0,
    isEarlyPhase: false,
    message: "You're part of our early community",
  };
}

/**
 * One-line under hero CTAs: `Join n/100 early users` (only in early phase).
 */
export function earlyUserHeroSubline(signals: EarlyUserSignals): string | null {
  if (signals.message === "") {
    return null;
  }
  if (!signals.isEarlyPhase) {
    return null;
  }
  return `Join ${signals.count}/${EARLY_USER_CAP} early users`;
}

/**
 * Onboarding / marketing strip — `message` is always from {@link buildEarlyUserSignalsFromCount} (real count).
 */
export function earlyUserOnboardingHeadline(signals: EarlyUserSignals): string {
  if (signals.message === "" || !signals.isEarlyPhase) {
    return "";
  }
  const prefix = signals.count < 50 ? "🔥" : "🚀";
  return `${prefix} ${signals.message}`;
}
