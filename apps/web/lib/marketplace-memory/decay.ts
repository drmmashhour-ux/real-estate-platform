/** Recency weight: 1.0 at t=0, halves every `halfLifeDays`. */
export function recencyWeight(createdAt: Date, now: Date = new Date(), halfLifeDays: number = 30): number {
  if (halfLifeDays <= 0) return 1;
  const ageDays = (now.getTime() - createdAt.getTime()) / 86_400_000;
  return Math.exp(-ageDays / halfLifeDays);
}

export function getMemoryHalfLifeDays(): number {
  const n = Number(process.env.MARKETPLACE_MEMORY_HALF_LIFE_DAYS);
  return Number.isFinite(n) && n > 0 ? n : 30;
}

export function getMemoryLookbackDays(): number {
  const n = Number(process.env.MARKETPLACE_MEMORY_LOOKBACK_DAYS);
  return Number.isFinite(n) && n > 0 ? n : 120;
}
