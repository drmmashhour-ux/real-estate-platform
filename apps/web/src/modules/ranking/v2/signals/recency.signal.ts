import { getFreshnessSignals } from "@/src/modules/ranking/signalEngine";

/** Recency proxy — same half-life model as v1 freshness. */
export function recency01(createdAt: Date, updatedAt: Date): number {
  return getFreshnessSignals(createdAt, updatedAt);
}
