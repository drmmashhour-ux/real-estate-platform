/**
 * Low-risk autonomy execution counters — prefix [growth:autonomy:execution], never throws.
 */

const PREFIX = "[growth:autonomy:execution]";

export type GrowthAutonomyExecutionMonitoringState = {
  attempted: number;
  executed: number;
  downgraded: number;
  undoTaken: number;
  blocked: number;
  sparseDowngrades: number;
  killSwitchPrevented: number;
};

let state: GrowthAutonomyExecutionMonitoringState = {
  attempted: 0,
  executed: 0,
  downgraded: 0,
  undoTaken: 0,
  blocked: 0,
  sparseDowngrades: 0,
  killSwitchPrevented: 0,
};

export function getGrowthAutonomyExecutionMonitoringSnapshot(): GrowthAutonomyExecutionMonitoringState {
  return { ...state };
}

export function resetGrowthAutonomyExecutionMonitoringForTests(): void {
  state = {
    attempted: 0,
    executed: 0,
    downgraded: 0,
    undoTaken: 0,
    blocked: 0,
    sparseDowngrades: 0,
    killSwitchPrevented: 0,
  };
}

function log(msg: string): void {
  try {
    console.info(`${PREFIX} ${msg}`);
  } catch {
    /* noop */
  }
}

export function recordExecutionAttempt(): void {
  try {
    state.attempted += 1;
    log(`attempt total=${state.attempted}`);
  } catch {
    /* noop */
  }
}

export function recordExecutionExecuted(): void {
  try {
    state.executed += 1;
    log(`executed total=${state.executed}`);
  } catch {
    /* noop */
  }
}

export function recordExecutionDowngraded(): void {
  try {
    state.downgraded += 1;
    log(`downgraded total=${state.downgraded}`);
  } catch {
    /* noop */
  }
}

export function recordExecutionUndo(): void {
  try {
    state.undoTaken += 1;
    log(`undo total=${state.undoTaken}`);
  } catch {
    /* noop */
  }
}

export function recordExecutionBlocked(): void {
  try {
    state.blocked += 1;
    log(`blocked total=${state.blocked}`);
  } catch {
    /* noop */
  }
}

export function recordSparseDowngrade(): void {
  try {
    state.sparseDowngrades += 1;
    log(`sparse_downgrade total=${state.sparseDowngrades}`);
  } catch {
    /* noop */
  }
}

export function recordKillSwitchPreventedExecution(): void {
  try {
    state.killSwitchPrevented += 1;
    log(`kill_switch_prevent total=${state.killSwitchPrevented}`);
  } catch {
    /* noop */
  }
}
