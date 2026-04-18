export function to100(x01: number): number {
  if (!Number.isFinite(x01)) return 0;
  return Math.min(100, Math.max(0, x01 * 100));
}
