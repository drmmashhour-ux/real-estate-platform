/**
 * Mission session telemetry — never throws.
 */

const LOG_PREFIX = "[growth:mission-session]";

export type GrowthMissionSessionMonitoringState = {
  sessionsStarted: number;
  sessionsCompleted: number;
  sessionsAbandoned: number;
  stepsCompleted: number;
  topActionsOpened: number;
  navigationLaunches: number;
};

let state: GrowthMissionSessionMonitoringState = {
  sessionsStarted: 0,
  sessionsCompleted: 0,
  sessionsAbandoned: 0,
  stepsCompleted: 0,
  topActionsOpened: 0,
  navigationLaunches: 0,
};

export function getGrowthMissionSessionMonitoringSnapshot(): GrowthMissionSessionMonitoringState {
  return { ...state };
}

export function resetGrowthMissionSessionMonitoringForTests(): void {
  state = {
    sessionsStarted: 0,
    sessionsCompleted: 0,
    sessionsAbandoned: 0,
    stepsCompleted: 0,
    topActionsOpened: 0,
    navigationLaunches: 0,
  };
}

export function recordMissionSessionStarted(): void {
  try {
    state.sessionsStarted += 1;
    console.info(`${LOG_PREFIX} started`);
  } catch {
    /* noop */
  }
}

export function recordMissionSessionCompleted(): void {
  try {
    state.sessionsCompleted += 1;
    console.info(`${LOG_PREFIX} completed`);
  } catch {
    /* noop */
  }
}

export function recordMissionSessionAbandoned(): void {
  try {
    state.sessionsAbandoned += 1;
    console.info(`${LOG_PREFIX} abandoned`);
  } catch {
    /* noop */
  }
}

export function recordMissionSessionStepCompleted(args: { kind: "top" | "other"; navigation?: boolean }): void {
  try {
    state.stepsCompleted += 1;
    if (args.kind === "top") state.topActionsOpened += 1;
    if (args.navigation) state.navigationLaunches += 1;
    console.info(`${LOG_PREFIX} step done kind=${args.kind} nav=${args.navigation ? "y" : "n"}`);
  } catch {
    /* noop */
  }
}
