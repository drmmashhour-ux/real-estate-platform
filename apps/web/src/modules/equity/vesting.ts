export type GrantVestingInput = {
  totalShares: number;
  vestingStart: Date;
  vestingDurationMonths: number;
  cliffMonths: number;
};

/**
 * Whole calendar months elapsed since `vestingStart` (UTC date boundaries).
 */
export function wholeMonthsElapsed(vestingStart: Date, asOf: Date): number {
  const sy = vestingStart.getUTCFullYear();
  const sm = vestingStart.getUTCMonth();
  const sd = vestingStart.getUTCDate();
  const ey = asOf.getUTCFullYear();
  const em = asOf.getUTCMonth();
  const ed = asOf.getUTCDate();

  if (asOf.getTime() < vestingStart.getTime()) return 0;

  let months = (ey - sy) * 12 + (em - sm);
  if (ed < sd) months -= 1;
  return Math.max(0, months);
}

/**
 * Linear vesting after cliff: 0 until `cliffMonths`, then proportional over
 * `(vestingDurationMonths - cliffMonths)` months; 100% at or after schedule end.
 */
export function calculateVestedShares(grant: GrantVestingInput, asOf: Date = new Date()): number {
  const total = grant.totalShares;
  if (total <= 0 || !Number.isFinite(total)) return 0;

  const cliff = Math.max(0, grant.cliffMonths);
  const duration = Math.max(0, grant.vestingDurationMonths);
  const monthsElapsed = wholeMonthsElapsed(grant.vestingStart, asOf);

  if (monthsElapsed >= duration) return total;
  if (monthsElapsed < cliff) return 0;

  const vestingWindow = duration - cliff;
  if (vestingWindow <= 0) return total;

  const monthsIntoVest = monthsElapsed - cliff;
  const fraction = Math.min(1, monthsIntoVest / vestingWindow);
  return total * fraction;
}

/** Month-by-month vested totals (for charts / diligence). */
export function buildVestingSchedule(grant: GrantVestingInput, maxMonths?: number): { month: number; vested: number }[] {
  const cap = maxMonths ?? grant.vestingDurationMonths + 6;
  const out: { month: number; vested: number }[] = [];
  const start = new Date(grant.vestingStart);
  for (let m = 0; m <= cap; m++) {
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + m, start.getUTCDate()));
    out.push({ month: m, vested: calculateVestedShares(grant, d) });
  }
  return out;
}
