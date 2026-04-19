/**
 * Orchestrates metrics → scores → insights — read-only.
 */

import { aggregateBrokerPerformanceMetrics } from "./broker-performance.service";
import { scoreBrokerPerformanceMetrics } from "./broker-performance-scoring.service";
import { buildBrokerPerformanceInsights } from "./broker-performance-insights.service";
import { buildBrokerIncentiveSignals } from "./broker-performance-incentive-signals.service";
import {
  recordEngineSnapshotBuilt,
  recordInsightsGenerated,
} from "./broker-performance-monitoring.service";
import type { BrokerPerformanceEngineSnapshot } from "./broker-performance.types";

export async function buildBrokerPerformanceEngineSnapshot(
  brokerId: string,
  options?: { emitMonitoring?: boolean },
): Promise<BrokerPerformanceEngineSnapshot | null> {
  const raw = await aggregateBrokerPerformanceMetrics(brokerId);
  if (!raw) return null;

  const metrics = scoreBrokerPerformanceMetrics(raw);
  const insights = buildBrokerPerformanceInsights(metrics);
  const incentives = buildBrokerIncentiveSignals(metrics);

  const emit = options?.emitMonitoring !== false;
  if (emit) {
    recordEngineSnapshotBuilt({
      band: metrics.executionBand,
      confidence: metrics.confidenceLevel,
      insufficient: metrics.executionBand === "insufficient_data",
    });
    recordInsightsGenerated(insights.length);
  }

  return { metrics, insights, incentives };
}
