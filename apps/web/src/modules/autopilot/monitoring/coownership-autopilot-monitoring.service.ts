/**
 * Lightweight counters for co-ownership autopilot observability (process lifetime).
 * Persisted audit trail lives in `LecipmCoreAutopilotAction` rows.
 */

export type CoownershipAutopilotMetrics = {
  complianceChecksTriggered: number;
  complianceWarnings: number;
  complianceBlocks: number;
};

let complianceChecksTriggered = 0;
let complianceWarnings = 0;
let complianceBlocks = 0;

const NS = "[autopilot][coownership]";

export function resetCoownershipAutopilotMetricsForTests(): void {
  complianceChecksTriggered = 0;
  complianceWarnings = 0;
  complianceBlocks = 0;
}

export function getCoownershipAutopilotMetrics(): CoownershipAutopilotMetrics {
  return {
    complianceChecksTriggered,
    complianceWarnings,
    complianceBlocks,
  };
}

export function recordCoownershipCheckTriggered(listingId: string): void {
  complianceChecksTriggered++;
  try {
    console.info(`${NS} triggered`, JSON.stringify({ listingId }));
  } catch {
    /* ignore */
  }
}

export function recordCoownershipChecklistEnsured(listingId: string): void {
  try {
    console.info(`${NS} checklist ensured`, JSON.stringify({ listingId }));
  } catch {
    /* ignore */
  }
}

export function recordCoownershipWarning(listingId: string): void {
  complianceWarnings++;
  try {
    console.info(`${NS} warning`, JSON.stringify({ listingId }));
  } catch {
    /* ignore */
  }
}

export function recordCoownershipBlocked(listingId: string, reason: string): void {
  complianceBlocks++;
  try {
    console.info(`${NS} blocked action`, JSON.stringify({ listingId, reason }));
  } catch {
    /* ignore */
  }
}
