/**
 * Conservative band classification — advisory labels only.
 */

import type { BrokerPerformanceBand } from "./broker-performance.types";

export function classifyBrokerPerformanceBand(
  score: number,
  signals: { weak: string[]; strong: string[] },
): BrokerPerformanceBand {
  if (score < 25) return "low";
  if (score < 50) return "watch";
  if (score >= 75 && signals.weak.length <= 1) return "strong";
  if (score >= 50) return "good";
  return "watch";
}
