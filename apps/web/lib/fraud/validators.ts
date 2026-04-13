/**
 * Small pure helpers for fraud rules.
 */

export function duplicateUrlCount(urls: string[]): number {
  const norm = urls.map((u) => u.trim().toLowerCase()).filter(Boolean);
  const uniq = new Set(norm);
  return Math.max(0, norm.length - uniq.size);
}

export function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}
