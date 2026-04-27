const DEFAULT_DROP_FLOOR = 0.8;

/**
 * Compare two conversion **rates** (0–1 or per-view ratios). `after` below 80% of `before` → risky.
 */
export function detectConversionDrop(before: number, after: number, floor: number = DEFAULT_DROP_FLOOR): boolean {
  if (!Number.isFinite(before) || !Number.isFinite(after) || before <= 0) {
    return false;
  }
  return after < before * floor;
}
