/**
 * Level 5 guardrails — these primitives must **never** be auto-executed by autonomy,
 * regardless of mode (including any future "full" mode).
 */
export const FORBIDDEN_AUTONOMOUS_PRIMITIVES = [
  "send_money",
  "capture_payment",
  "confirm_payment",
  "refund_payment",
  "resolve_dispute",
  "send_legal_message",
  "override_admin_lock",
  "execute_payout",
] as const;

export type ForbiddenAutonomousPrimitive = (typeof FORBIDDEN_AUTONOMOUS_PRIMITIVES)[number];

const FORBIDDEN_SET = new Set<string>(FORBIDDEN_AUTONOMOUS_PRIMITIVES);

export function isForbiddenAutonomousPrimitive(actionKey: string): boolean {
  return FORBIDDEN_SET.has(actionKey.trim().toLowerCase());
}
