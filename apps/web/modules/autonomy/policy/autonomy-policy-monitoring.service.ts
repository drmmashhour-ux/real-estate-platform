let evaluationsCount = 0;
let criticalCount = 0;

export function trackAutonomyPolicyEvaluation(criticalTriggered: boolean): void {
  evaluationsCount += 1;
  if (criticalTriggered) criticalCount += 1;
}

export function getAutonomyPolicyMonitoringSnapshot() {
  return {
    evaluationsCount,
    criticalCount,
  };
}

export function resetAutonomyPolicyMonitoringForTests(): void {
  evaluationsCount = 0;
  criticalCount = 0;
}
