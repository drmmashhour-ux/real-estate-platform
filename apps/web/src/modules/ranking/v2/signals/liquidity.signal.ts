import type { RankingSignalBundle } from "@/src/modules/ranking/types";

/** Composite liquidity proxy (0–1) — availability + engagement + conversion. */
export function liquidity01(s: RankingSignalBundle): number {
  return Math.min(1, 0.45 * s.availability + 0.35 * s.engagement + 0.2 * s.conversion);
}
