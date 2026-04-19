/**
 * Logs when outcome summaries are computed — prefix [ops-assistant:approval-results]; never throws.
 */

const LOG_PREFIX = "[ops-assistant:approval-results]";

type Counts = {
  summariesComputed: number;
  decisions: Record<string, number>;
  safety: Record<string, number>;
  usefulness: Record<string, number>;
  insufficientData: number;
};

const state: Counts = {
  summariesComputed: 0,
  decisions: {},
  safety: {},
  usefulness: {},
  insufficientData: 0,
};

function log(msg: string): void {
  try {
    console.info(`${LOG_PREFIX} ${msg}`);
  } catch {
    /* ignore */
  }
}

function bump(map: Record<string, number>, key: string): void {
  map[key] = (map[key] ?? 0) + 1;
}

export function recordApprovalResultsComputed(payload: {
  decision: string;
  safety: string;
  usefulness: string;
  insufficientData: boolean;
}): void {
  try {
    state.summariesComputed += 1;
    bump(state.decisions, payload.decision);
    bump(state.safety, payload.safety);
    bump(state.usefulness, payload.usefulness);
    if (payload.insufficientData) state.insufficientData += 1;
    log(
      `computed decision=${payload.decision} safety=${payload.safety} usefulness=${payload.usefulness} insufficient=${payload.insufficientData}`,
    );
  } catch {
    /* never throw */
  }
}

export function getApprovalResultsMonitoringSnapshot(): Readonly<Counts> {
  return { ...state, decisions: { ...state.decisions }, safety: { ...state.safety }, usefulness: { ...state.usefulness } };
}

export function resetApprovalResultsMonitoringForTests(): void {
  try {
    state.summariesComputed = 0;
    state.decisions = {};
    state.safety = {};
    state.usefulness = {};
    state.insufficientData = 0;
  } catch {
    /* ignore */
  }
}
