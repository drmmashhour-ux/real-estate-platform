/** Shared normalization helpers for ranking (0–1 scales). */

export function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/** log(1+x) / log(1+cap) — saturating growth */
export function normLog(x: number, cap: number): number {
  return clamp01(Math.log1p(Math.max(0, x)) / Math.log1p(Math.max(1, cap)));
}

export function inverseRankPosition(position: number, total: number): number {
  if (total <= 1) return 1;
  return clamp01(1 - position / Math.max(1, total - 1));
}

export function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}
