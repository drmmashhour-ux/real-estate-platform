/** Net adjustment in cents (positive = increases adjusted comp value). */
export function netAdjustmentCents(rows: { amountCents: number; direction: string }[]): number {
  return rows.reduce((sum, r) => sum + (r.direction === "plus" ? r.amountCents : -r.amountCents), 0);
}

export function adjustedPriceCents(originalCents: number, applied: { amountCents: number; direction: string }[]): number {
  return originalCents + netAdjustmentCents(applied);
}
