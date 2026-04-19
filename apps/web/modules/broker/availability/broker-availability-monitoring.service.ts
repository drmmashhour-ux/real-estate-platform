/**
 * Availability / capacity / SLA routing telemetry — never throws.
 */

const LOG_AVAIL = "[broker:availability]";
const LOG_CAP = "[broker:capacity]";
const LOG_SLA = "[broker:sla]";
const LOG_MERGE = "[broker:availability]"; // routing merge uses same family

export type BrokerAvailabilityMonitoringState = {
  availabilitySnapshotsBuilt: number;
  capacitySnapshotsBuilt: number;
  slaSnapshotsBuilt: number;
  routingAvailabilityMerged: number;
  routingRecommendationsWithSignals: number;
  sparseDataFallbacks: number;
  sparseSlaSignals: number;
};

let state: BrokerAvailabilityMonitoringState = {
  availabilitySnapshotsBuilt: 0,
  capacitySnapshotsBuilt: 0,
  slaSnapshotsBuilt: 0,
  routingAvailabilityMerged: 0,
  routingRecommendationsWithSignals: 0,
  sparseDataFallbacks: 0,
  sparseSlaSignals: 0,
};

export function getBrokerAvailabilityMonitoringSnapshot(): BrokerAvailabilityMonitoringState {
  return { ...state };
}

export function resetBrokerAvailabilityMonitoringForTests(): void {
  state = {
    availabilitySnapshotsBuilt: 0,
    capacitySnapshotsBuilt: 0,
    slaSnapshotsBuilt: 0,
    routingAvailabilityMerged: 0,
    routingRecommendationsWithSignals: 0,
    sparseDataFallbacks: 0,
    sparseSlaSignals: 0,
  };
}

export function recordBrokerAvailabilitySnapshotBuilt(args: { sparse: boolean }): void {
  try {
    state.availabilitySnapshotsBuilt += 1;
    if (args.sparse) state.sparseDataFallbacks += 1;
    console.info(`${LOG_AVAIL} snapshot sparse=${args.sparse ? "y" : "n"}`);
  } catch {
    /* noop */
  }
}

export function recordBrokerCapacitySnapshotBuilt(args: { sparse: boolean }): void {
  try {
    state.capacitySnapshotsBuilt += 1;
    if (args.sparse) state.sparseDataFallbacks += 1;
    console.info(`${LOG_CAP} snapshot sparse=${args.sparse ? "y" : "n"}`);
  } catch {
    /* noop */
  }
}

export function recordBrokerSlaSnapshotBuilt(args: { insufficient: boolean }): void {
  try {
    state.slaSnapshotsBuilt += 1;
    if (args.insufficient) state.sparseSlaSignals += 1;
    console.info(`${LOG_SLA} snapshot insufficient=${args.insufficient ? "y" : "n"}`);
  } catch {
    /* noop */
  }
}

export function recordBrokerRoutingAvailabilityMerged(args: {
  adjustment: number;
  sparseSla?: boolean;
}): void {
  try {
    state.routingAvailabilityMerged += 1;
    if (args.sparseSla) state.sparseSlaSignals += 1;
    console.info(`${LOG_MERGE} merged adjustment=${args.adjustment}`);
  } catch {
    /* noop */
  }
}

export function recordBrokerRoutingRecommendationUsedSignals(): void {
  try {
    state.routingRecommendationsWithSignals += 1;
    console.info(`${LOG_MERGE} routing row used availability/capacity/SLA signals`);
  } catch {
    /* noop */
  }
}
