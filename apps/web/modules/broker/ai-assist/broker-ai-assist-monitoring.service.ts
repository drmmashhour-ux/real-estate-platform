/**
 * In-process telemetry — `[broker:ai-assist]`. Never throws.
 */

import { logInfo } from "@/lib/logger";

const LOG = "[broker:ai-assist]";

export type BrokerAiAssistMonitoringSnapshot = {
  assistSummariesBuilt: number;
  signalsGenerated: number;
  suggestionsShown: number;
  draftHintsMapped: number;
  objectionHelpShown: number;
  dailySummariesBuilt: number;
};

let state: BrokerAiAssistMonitoringSnapshot = {
  assistSummariesBuilt: 0,
  signalsGenerated: 0,
  suggestionsShown: 0,
  draftHintsMapped: 0,
  objectionHelpShown: 0,
  dailySummariesBuilt: 0,
};

export function getBrokerAiAssistMonitoringSnapshot(): BrokerAiAssistMonitoringSnapshot {
  return { ...state };
}

export function resetBrokerAiAssistMonitoringForTests(): void {
  state = {
    assistSummariesBuilt: 0,
    signalsGenerated: 0,
    suggestionsShown: 0,
    draftHintsMapped: 0,
    objectionHelpShown: 0,
    dailySummariesBuilt: 0,
  };
}

export function recordAssistSummaryBuilt(meta: { signalCount: number; suggestionCount: number }): void {
  try {
    state.assistSummariesBuilt += 1;
    state.signalsGenerated += meta.signalCount;
    state.suggestionsShown += meta.suggestionCount;
    logInfo(`${LOG} summary`, meta);
  } catch {
    /* noop */
  }
}

export function recordDraftHintMapped(): void {
  try {
    state.draftHintsMapped += 1;
    logInfo(`${LOG} draft_hint`);
  } catch {
    /* noop */
  }
}

export function recordObjectionHelpShown(): void {
  try {
    state.objectionHelpShown += 1;
    logInfo(`${LOG} objection_help`);
  } catch {
    /* noop */
  }
}

export function recordDailyAssistBuilt(): void {
  try {
    state.dailySummariesBuilt += 1;
    logInfo(`${LOG} daily`);
  } catch {
    /* noop */
  }
}
