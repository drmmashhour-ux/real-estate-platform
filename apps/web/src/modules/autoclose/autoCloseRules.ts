/**
 * Safe auto-close: strictly allowlisted actions and content gates.
 * Blocks financial commitments, promises, and negotiation-style copy from automation.
 */

export const SAFE_AUTO_CLOSE_ACTIONS = ["follow_up_message", "booking_reminder", "inactivity_nudge"] as const;

export type SafeAutoCloseAction = (typeof SAFE_AUTO_CLOSE_ACTIONS)[number];

export function isSafeAutoCloseAction(value: string): value is SafeAutoCloseAction {
  return (SAFE_AUTO_CLOSE_ACTIONS as readonly string[]).includes(value);
}

/**
 * Patterns that must NEVER be sent by auto-close (negotiation, money movement, guarantees).
 */
const BLOCKED_MESSAGE_PATTERNS: readonly RegExp[] = [
  /\b(guarantee|guaranteed|we guarantee|promise you|i promise)\b/i,
  /\b(non-?refundable|wire transfer|send (the )?money|send payment|pay now|pay today|deposit today)\b/i,
  /\b(sign today or|limited time only act now|act now or)\b/i,
  /\b(counter-?offer|accept (this|our) offer|reject the offer|negotiate the price|lower the price to|final offer)\b/i,
  /\b(we('ll| will) pay you|cash back|rebate of|refund you|price match)\b/i,
  /\b(legally binding|sign here|e-?sign (this|the) contract today)\b/i,
  /\$\s*\d+|\b\d+\s*%\s*off\b/i,
];

export type SafetyCheckResult = { ok: true } | { ok: false; reason: string };

/**
 * Validates outbound text before any automated Growth AI message is persisted.
 */
export function assertContentPassesAutoCloseSafetyRules(text: string): SafetyCheckResult {
  const t = text.trim();
  if (t.length < 8) return { ok: false, reason: "message_too_short" };
  if (t.length > 2000) return { ok: false, reason: "message_too_long" };

  for (const re of BLOCKED_MESSAGE_PATTERNS) {
    re.lastIndex = 0;
    if (re.test(t)) {
      return { ok: false, reason: `blocked_pattern:${re.source.slice(0, 48)}` };
    }
  }
  return { ok: true };
}

/** Template placeholders: {{name}}, {{listing_title}} — validated after personalization. */
export const AUTO_CLOSE_INACTIVITY_TEMPLATE =
  "Hi {{name}} — quick check-in on {{listing_title}}. If you still have questions, I'm happy to help. No rush — reply when it works for you.";
