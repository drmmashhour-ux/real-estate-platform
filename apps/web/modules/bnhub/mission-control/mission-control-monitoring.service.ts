/**
 * In-process monitoring — never throws.
 */

const LOG = "[bnhub:mission-control]";

export type MissionControlMonitoringSnapshot = {
  summariesBuilt: number;
  weakCount: number;
  strongCount: number;
  risksDetected: number;
  opportunitiesDetected: number;
};

const state: MissionControlMonitoringSnapshot = {
  summariesBuilt: 0,
  weakCount: 0,
  strongCount: 0,
  risksDetected: 0,
  opportunitiesDetected: 0,
};

export function getMissionControlMonitoringSnapshot(): MissionControlMonitoringSnapshot {
  return { ...state };
}

export function resetMissionControlMonitoringForTests(): void {
  state.summariesBuilt = 0;
  state.weakCount = 0;
  state.strongCount = 0;
  state.risksDetected = 0;
  state.opportunitiesDetected = 0;
}

export function recordMissionControlBuilt(input: {
  status: "weak" | "watch" | "healthy" | "strong";
  risks: number;
  opportunities: number;
}): void {
  try {
    state.summariesBuilt += 1;
    if (input.status === "weak") state.weakCount += 1;
    if (input.status === "strong") state.strongCount += 1;
    state.risksDetected += input.risks;
    state.opportunitiesDetected += input.opportunities;
    // eslint-disable-next-line no-console
    console.log(LOG, "summary_built", input);
  } catch {
    /* never throw */
  }
}
