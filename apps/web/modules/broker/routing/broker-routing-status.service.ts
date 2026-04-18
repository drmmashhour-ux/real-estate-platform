/**
 * Fit band for routing rank score — conservative thresholds.
 */

import type { BrokerRoutingFitBand } from "./broker-routing.types";

export function classifyBrokerRoutingFit(score: number): BrokerRoutingFitBand {
  const s = Number.isFinite(score) ? score : 0;
  if (s >= 75) return "strong";
  if (s >= 50) return "good";
  if (s >= 25) return "watch";
  return "low";
}
