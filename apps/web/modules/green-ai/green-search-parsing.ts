/**
 * Heuristic parsing of illustrative grant `amount` strings (e.g. "up to $5,000").
 * Not a financial guarantee; used for discovery sort/filter only.
 */
export function sumIllustrativeGrantDollars(
  amountStrings: readonly string[]
): number {
  let total = 0;
  for (const s of amountStrings) {
    const t = s.replace(/[,\s]/g, "");
    const nums = t.match(/\$?(\d+(?:\.\d+)?)/g) ?? [];
    for (const n of nums) {
      const v = parseFloat(n.replace("$", ""));
      if (Number.isFinite(v)) total += v;
    }
  }
  return Math.round(total);
}
