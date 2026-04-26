/**
 * Simple platform take rate (Order 55). Amounts in the same unit (e.g. cents) end-to-end.
 * `payout = total - calculateFee(total)`.
 */
export function calculateFee(amount: number) {
  return Math.round(amount * 0.1);
}
