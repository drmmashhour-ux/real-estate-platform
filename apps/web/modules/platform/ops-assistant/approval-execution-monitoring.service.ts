/**
 * Counters + structured logs — prefix [ops-assistant:approval]; never throws.
 */

const counts = {
  requestsCreated: 0,
  approvals: 0,
  denials: 0,
  executions: 0,
  failures: 0,
  undos: 0,
  blockedBySafety: 0,
};

function log(msg: string): void {
  try {
    console.info(`[ops-assistant:approval] ${msg}`);
  } catch {
    /* ignore */
  }
}

export function recordApprovalRequestCreated(requestId: string): void {
  try {
    counts.requestsCreated += 1;
    log(`request_created id=${requestId.slice(0, 12)}…`);
  } catch {
    /* ignore */
  }
}

export function recordApprovalApproved(requestId: string): void {
  try {
    counts.approvals += 1;
    log(`approved id=${requestId.slice(0, 12)}…`);
  } catch {
    /* ignore */
  }
}

export function recordApprovalDenied(requestId: string): void {
  try {
    counts.denials += 1;
    log(`denied id=${requestId.slice(0, 12)}…`);
  } catch {
    /* ignore */
  }
}

export function recordApprovalExecuted(requestId: string): void {
  try {
    counts.executions += 1;
    log(`executed id=${requestId.slice(0, 12)}…`);
  } catch {
    /* ignore */
  }
}

export function recordApprovalFailed(requestId: string, reason: string): void {
  try {
    counts.failures += 1;
    log(`failed id=${requestId.slice(0, 12)}… reason=${reason}`);
  } catch {
    /* ignore */
  }
}

export function recordApprovalUndone(requestId: string): void {
  try {
    counts.undos += 1;
    log(`undone id=${requestId.slice(0, 12)}…`);
  } catch {
    /* ignore */
  }
}

export function recordApprovalBlockedSafety(reason: string): void {
  try {
    counts.blockedBySafety += 1;
    log(`blocked_safety ${reason}`);
  } catch {
    /* ignore */
  }
}

export function getApprovalMonitoringSnapshot(): typeof counts {
  return { ...counts };
}

export function resetApprovalMonitoringForTests(): void {
  counts.requestsCreated = 0;
  counts.approvals = 0;
  counts.denials = 0;
  counts.executions = 0;
  counts.failures = 0;
  counts.undos = 0;
  counts.blockedBySafety = 0;
}
