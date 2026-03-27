/**
 * Platform vs expert split for closed mortgage deals (amounts in dollars).
 */
export function splitMortgageCommission(
  dealAmount: number,
  platformRate: number
): { platformShare: number; expertShare: number } {
  const rate = Number.isFinite(platformRate) ? Math.min(Math.max(platformRate, 0), 1) : 0.3;
  const amt = Math.max(0, Math.round(dealAmount));
  const platformShare = Math.round(amt * rate);
  const expertShare = amt - platformShare;
  return { platformShare, expertShare };
}
