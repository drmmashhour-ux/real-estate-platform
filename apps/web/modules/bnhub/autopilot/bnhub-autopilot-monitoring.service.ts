/**
 * BNHub autopilot execution monitoring — never throws.
 */

const LOG = "[bnhub:autopilot]";

export type BnhubAutopilotMonitoringSnapshot = {
  actionsCreated: number;
  approved: number;
  rejected: number;
  executed: number;
  rolledBack: number;
};

const state: BnhubAutopilotMonitoringSnapshot = {
  actionsCreated: 0,
  approved: 0,
  rejected: 0,
  executed: 0,
  rolledBack: 0,
};

export function getBnhubAutopilotMonitoringSnapshot(): BnhubAutopilotMonitoringSnapshot {
  return { ...state };
}

export function resetBnhubAutopilotMonitoringForTests(): void {
  state.actionsCreated = 0;
  state.approved = 0;
  state.rejected = 0;
  state.executed = 0;
  state.rolledBack = 0;
}

export function recordBnhubAutopilotActionsBuilt(count: number): void {
  try {
    state.actionsCreated += count;
    // eslint-disable-next-line no-console
    console.log(LOG, "actions_built", { count });
  } catch {
    /* */
  }
}

export function recordBnhubAutopilotApproved(actionId: string): void {
  try {
    state.approved += 1;
    // eslint-disable-next-line no-console
    console.log(LOG, "approved", { actionId: actionId.slice(0, 12) });
  } catch {
    /* */
  }
}

export function recordBnhubAutopilotRejected(actionId: string): void {
  try {
    state.rejected += 1;
    // eslint-disable-next-line no-console
    console.log(LOG, "rejected", { actionId: actionId.slice(0, 12) });
  } catch {
    /* */
  }
}

export function recordBnhubAutopilotExecuted(actionId: string): void {
  try {
    state.executed += 1;
    // eslint-disable-next-line no-console
    console.log(LOG, "executed", { actionId: actionId.slice(0, 12) });
  } catch {
    /* */
  }
}

export function recordBnhubAutopilotRolledBack(actionId: string): void {
  try {
    state.rolledBack += 1;
    // eslint-disable-next-line no-console
    console.log(LOG, "rolled_back", { actionId: actionId.slice(0, 12) });
  } catch {
    /* */
  }
}
