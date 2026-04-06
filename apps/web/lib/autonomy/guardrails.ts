import type { AutonomousAction } from "./types";

const BLOCKED_TYPE_PREFIXES = [
  "payment",
  "refund",
  "payout",
  "stripe_capture",
  "confirm_payment",
  "dispute",
  "legal_message",
  "send_money",
] as const;

/**
 * Hard block: never auto-run these families regardless of mode (Level 5 guardrails).
 */
export function isBlockedAction(action: AutonomousAction): boolean {
  const t = action.type.trim().toLowerCase();
  if (BLOCKED_TYPE_PREFIXES.some((p) => t === p || t.startsWith(`${p}_`) || t.includes(p))) {
    return true;
  }
  if (/^refund|^payout|^capture|^charge/.test(t)) return true;
  return false;
}
