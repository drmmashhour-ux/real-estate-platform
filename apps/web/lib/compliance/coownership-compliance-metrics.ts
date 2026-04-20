/** In-process counters for co-ownership merged compliance (observability hooks). */

export const coownershipComplianceMetrics = {
  mergedChecklistCreated: 0,
  checklistItemUpdates: 0,
  snapshotsRecomputed: 0,
  criticalBlocks: 0,
  complianceWarnings: 0,
  certificateWarnings: 0,
  insuranceWarnings: 0,
  autopilotTriggers: 0,
  autopilotRecommendations: 0,
  autopilotBlocks: 0,
};

export function bumpMergedComplianceMetric(
  key: keyof typeof coownershipComplianceMetrics,
  delta = 1,
): void {
  try {
    coownershipComplianceMetrics[key] += delta;
  } catch {
    /* noop */
  }
}
