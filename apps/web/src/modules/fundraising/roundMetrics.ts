/** Amounts that count toward the round's raised total (not soft interest). */
export function commitmentStatusCountsTowardRaised(status: string): boolean {
  return status === "committed" || status === "transferred";
}

export function computeRaisedFromCommitments(rows: { amount: number; status: string }[]): number {
  let sum = 0;
  for (const r of rows) {
    if (commitmentStatusCountsTowardRaised(r.status)) sum += r.amount;
  }
  return sum;
}

export function roundProgressPercent(target: number, raised: number): number {
  if (!Number.isFinite(target) || target <= 0) return 0;
  const pct = (raised / target) * 100;
  return Math.min(100, Math.max(0, pct));
}

export function roundRemaining(target: number, raised: number): number {
  if (!Number.isFinite(target) || !Number.isFinite(raised)) return 0;
  return Math.max(0, target - raised);
}
