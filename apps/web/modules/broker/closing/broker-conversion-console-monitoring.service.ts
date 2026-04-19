/**
 * Deal Conversion Console — bounded counters + logs `[broker:conversion-console]`.
 * Never throws.
 */

import { logInfo } from "@/lib/logger";

const LOG = "[broker:conversion-console]";

export type ConversionConsoleMonitoringSnapshot = {
  consoleOpened: number;
  focusLeadSelected: number;
  nextActionExecuted: number;
  draftsOpened: number;
  sessionsStarted: number;
  sessionsCompleted: number;
};

let state: ConversionConsoleMonitoringSnapshot = {
  consoleOpened: 0,
  focusLeadSelected: 0,
  nextActionExecuted: 0,
  draftsOpened: 0,
  sessionsStarted: 0,
  sessionsCompleted: 0,
};

export function getConversionConsoleMonitoringSnapshot(): ConversionConsoleMonitoringSnapshot {
  return { ...state };
}

export function resetConversionConsoleMonitoringForTests(): void {
  state = {
    consoleOpened: 0,
    focusLeadSelected: 0,
    nextActionExecuted: 0,
    draftsOpened: 0,
    sessionsStarted: 0,
    sessionsCompleted: 0,
  };
}

export function recordConversionConsoleOpened(): void {
  try {
    state.consoleOpened += 1;
    logInfo(`${LOG} console_opened`);
  } catch {
    /* noop */
  }
}

export function recordConversionFocusLead(leadId: string): void {
  try {
    state.focusLeadSelected += 1;
    logInfo(`${LOG} focus_lead`, { leadId });
  } catch {
    /* noop */
  }
}

export function recordConversionNextActionExecuted(action: string): void {
  try {
    state.nextActionExecuted += 1;
    logInfo(`${LOG} next_action_executed`, { action });
  } catch {
    /* noop */
  }
}

export function recordConversionDraftOpened(): void {
  try {
    state.draftsOpened += 1;
    logInfo(`${LOG} draft_opened`);
  } catch {
    /* noop */
  }
}

export function recordConversionSessionStarted(): void {
  try {
    state.sessionsStarted += 1;
    logInfo(`${LOG} session_started`);
  } catch {
    /* noop */
  }
}

export function recordConversionSessionCompleted(): void {
  try {
    state.sessionsCompleted += 1;
    logInfo(`${LOG} session_completed`);
  } catch {
    /* noop */
  }
}
