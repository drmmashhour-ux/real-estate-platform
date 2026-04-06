/**
 * Host AI Autopilot — actions that must never run without explicit human approval.
 * Refunds, payouts, and legal moves are blocked from any automatic execution path.
 */

const FINANCIAL_OR_IRREVERSIBLE_PREFIXES = [
  "refund",
  "payout",
  "stripe_payout",
  "stripe_refund",
  "legal",
  "chargeback",
  "escrow_release",
  "contract_sign",
  "platform_payment",
] as const;

export function isFinancialOrIrreversibleActionKey(actionKey: string): boolean {
  const k = actionKey.toLowerCase();
  return FINANCIAL_OR_IRREVERSIBLE_PREFIXES.some((p) => k === p || k.startsWith(`${p}_`) || k.includes(`:${p}`));
}

/** True when autopilot must not apply DB writes for this key without an approved request. */
export function requiresApprovalForActionKey(actionKey: string): boolean {
  return isFinancialOrIrreversibleActionKey(actionKey) || kIsPricingOrPromotion(actionKey);
}

function kIsPricingOrPromotion(actionKey: string): boolean {
  const k = actionKey.toLowerCase();
  return (
    k.includes("price") ||
    k.includes("pricing") ||
    k.includes("promotion") ||
    k.includes("discount") ||
    k.includes("coupon")
  );
}
