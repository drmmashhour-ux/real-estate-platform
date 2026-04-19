/**
 * Ops assistant telemetry — console + in-memory counters; never throws.
 */

const LOG_PREFIX = "[ops-assistant]";

export type OpsAssistantMonitoringSnapshot = {
  suggestionsBuilt: number;
  suggestionsShown: number;
  suggestionClicks: number;
  confirmations: number;
  cancellations: number;
  actionsCompleted: number;
};

let state: OpsAssistantMonitoringSnapshot = {
  suggestionsBuilt: 0,
  suggestionsShown: 0,
  suggestionClicks: 0,
  confirmations: 0,
  cancellations: 0,
  actionsCompleted: 0,
};

function safeRun(fn: () => void): void {
  try {
    fn();
  } catch {
    /* never throw */
  }
}

export function resetOpsAssistantMonitoringForTests(): void {
  safeRun(() => {
    state = {
      suggestionsBuilt: 0,
      suggestionsShown: 0,
      suggestionClicks: 0,
      confirmations: 0,
      cancellations: 0,
      actionsCompleted: 0,
    };
  });
}

export function getOpsAssistantMonitoringSnapshot(): OpsAssistantMonitoringSnapshot {
  return { ...state };
}

export function recordOpsAssistantSuggestionsBuilt(_priorityId: string, count: number): void {
  safeRun(() => {
    state.suggestionsBuilt += count;
    if (count > 0) {
      console.info(`${LOG_PREFIX} suggestions_materialized count=${count}`);
    }
  });
}

export function recordOpsAssistantSuggestionsShown(total: number): void {
  safeRun(() => {
    state.suggestionsShown += total;
    console.info(`${LOG_PREFIX} panel_render suggestions_total=${total}`);
  });
}

export function recordOpsAssistantSuggestionClicked(suggestionId: string, priorityId: string): void {
  safeRun(() => {
    state.suggestionClicks += 1;
    console.info(`${LOG_PREFIX} click suggestionId=${suggestionId} priorityId=${priorityId.slice(0, 8)}…`);
  });
}

export function recordOpsAssistantConfirmed(suggestionId: string, priorityId: string): void {
  safeRun(() => {
    state.confirmations += 1;
    console.info(`${LOG_PREFIX} confirm suggestionId=${suggestionId} priorityId=${priorityId.slice(0, 8)}…`);
  });
}

export function recordOpsAssistantCancelled(suggestionId: string, priorityId: string): void {
  safeRun(() => {
    state.cancellations += 1;
    console.info(`${LOG_PREFIX} cancel suggestionId=${suggestionId} priorityId=${priorityId.slice(0, 8)}…`);
  });
}

export function recordOpsAssistantActionCompleted(suggestionId: string, priorityId: string): void {
  safeRun(() => {
    state.actionsCompleted += 1;
    console.info(`${LOG_PREFIX} completed suggestionId=${suggestionId} priorityId=${priorityId.slice(0, 8)}…`);
  });
}
