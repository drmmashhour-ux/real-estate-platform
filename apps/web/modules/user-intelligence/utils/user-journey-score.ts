const DAY = 86_400_000;

/**
 * 0-1 recency of last activity; deterministic.
 */
export function recency01(last: Date | null, now: Date = new Date()): number {
  if (!last) {
    return 0;
  }
  const t = (now.getTime() - last.getTime()) / DAY;
  if (t <= 0) {
    return 1;
  }
  if (t > 180) {
    return 0.15;
  }
  return Math.max(0, 1 - t / 200);
}

/**
 * Combined intent + stage "sharpness" for gating (no ML).
 */
export function journeyIntentWeight(args: { domain: string | null; stage: string | null; lastActivity: Date | null }): number {
  const r = recency01(args.lastActivity);
  const d = (args.domain ?? "").length > 0 ? 0.45 : 0.2;
  const s = (args.stage ?? "").length > 0 ? 0.35 : 0.1;
  return Math.min(1, r * (0.2 + d + s));
}
