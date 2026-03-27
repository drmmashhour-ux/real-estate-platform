/** CAD price for unlocking borrower contact, aligned with intent scoring. */
export function computeLeadValueFromIntent(intentLevel: string): number {
  const i = intentLevel.toLowerCase();
  if (i === "high") return 50;
  if (i === "low") return 20;
  return 35;
}
