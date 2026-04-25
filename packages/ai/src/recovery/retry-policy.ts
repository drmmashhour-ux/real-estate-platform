export const DEFAULT_RETRY = { maxAttempts: 3, baseMs: 200, maxMs: 4000 };

export function backoffMs(attempt: number, base = DEFAULT_RETRY.baseMs, max = DEFAULT_RETRY.maxMs): number {
  return Math.min(max, base * 2 ** Math.max(0, attempt - 1));
}
