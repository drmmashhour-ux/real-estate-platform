/**
 * SLA health from CRM-derived performance breakdown — explicit insufficient-data path.
 */

import type {
  BrokerPerformanceMetrics,
  BrokerPerformanceSummary,
} from "@/modules/broker/performance/broker-performance.types";
import type { BrokerSlaHealth, BrokerSlaSnapshot } from "./broker-availability.types";
import { recordBrokerSlaSnapshotBuilt } from "./broker-availability-monitoring.service";

export type BuildBrokerSlaInput = {
  brokerId: string;
  performanceSummary: BrokerPerformanceSummary | null;
};

/**
 * Uses performance breakdown scores already computed from CRM — no secondary precision claims.
 */
export function buildBrokerSlaSnapshot(input: BuildBrokerSlaInput): BrokerSlaSnapshot {
  try {
    recordBrokerSlaSnapshotBuilt({ insufficient: !input.performanceSummary });
  } catch {
    /* noop */
  }

  const perf = input.performanceSummary;
  if (!perf) {
    return {
      brokerId: input.brokerId,
      slaHealth: "insufficient_data",
      explanation: "No CRM performance snapshot for SLA routing — neutral influence.",
    };
  }

  const ws = perf.weakSignals.join(" ").toLowerCase();
  if (
    ws.includes("no assigned crm leads") ||
    ws.includes("no unlock-to-first-contact pairs") ||
    ws.includes("not measurable without leads")
  ) {
    return {
      brokerId: input.brokerId,
      slaHealth: "insufficient_data",
      explanation: "Thin CRM sample — SLA health not scored; routing stays balanced.",
    };
  }

  const rsp = perf.breakdown.responseSpeedScore;
  const eng = perf.breakdown.engagementScore;

  const dueHints = perf.weakSignals.filter((w) =>
    /follow|due|idle|response speed defaulted neutral|attention/i.test(w),
  ).length;

  let slaHealth: BrokerSlaHealth = "moderate";
  if (rsp >= 74 && eng >= 68 && dueHints <= 1) slaHealth = "good";
  else if (rsp < 48 || eng < 46 || dueHints >= 4) slaHealth = "poor";

  const explanation =
    slaHealth === "good"
      ? "Response and engagement scores look healthy for this sample — mild routing preference."
      : slaHealth === "poor"
        ? "Follow-up / response strain in CRM summary — routing confidence softened (not a hard block)."
        : "Mixed CRM discipline signals — neutral-to-slight caution in routing.";

  return {
    brokerId: input.brokerId,
    slaHealth,
    explanation,
  };
}

/** Team/dashboard rollups — uses engine metrics directly (same discipline signals, no fabricated rates). */
export function buildBrokerSlaSnapshotFromEngineMetrics(metrics: BrokerPerformanceMetrics): BrokerSlaSnapshot {
  try {
    recordBrokerSlaSnapshotBuilt({
      insufficient: metrics.leadsAssigned < 3 || metrics.confidenceLevel === "insufficient",
    });
  } catch {
    /* noop */
  }

  if (metrics.leadsAssigned < 3 || metrics.confidenceLevel === "insufficient") {
    return {
      brokerId: metrics.brokerId,
      slaHealth: "insufficient_data",
      explanation: "Thin CRM sample — SLA tier not asserted for oversight display.",
    };
  }

  const duePressure = metrics.followUpsDue >= 4;
  const slow =
    metrics.avgResponseDelayHours != null &&
    metrics.avgResponseDelayHours > 48 &&
    metrics.confidenceLevel !== "high";

  let slaHealth: BrokerSlaHealth = "moderate";
  if (
    metrics.disciplineScore >= 72 &&
    metrics.activityScore >= 68 &&
    metrics.followUpsDue <= 2 &&
    !slow &&
    (metrics.executionBand === "elite" || metrics.executionBand === "strong" || metrics.executionBand === "healthy")
  ) {
    slaHealth = "good";
  } else if (duePressure || slow || metrics.executionBand === "weak") {
    slaHealth = "poor";
  }

  const explanation =
    slaHealth === "good"
      ? "Follow-up and activity scores look healthy for this cohort snapshot."
      : slaHealth === "poor"
        ? "Follow-up pressure or slower response proxies — coaching-friendly signal (not a router block)."
        : "Mixed discipline signals — neutral posture.";

  return {
    brokerId: metrics.brokerId,
    avgResponseDelayHours: metrics.avgResponseDelayHours,
    slaHealth,
    explanation,
  };
}
