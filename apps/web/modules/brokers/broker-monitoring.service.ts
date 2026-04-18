import { logInfo } from "@/lib/logger";

export type BrokerMonitoringSnapshot = {
  prospectsAdded: number;
  stageChanges: number;
  notesAdded: number;
  scriptsCopied: number;
  /** Stage → converted or explicit purchase mark */
  conversionsMarked: number;
  lostDeals: number;
  /** Broker unlock checkout attempts (existing) */
  conversionAttempts: number;
  missingDataWarnings: number;
  /** @deprecated same as conversionsMarked */
  conversions: number;
};

const state: BrokerMonitoringSnapshot = {
  prospectsAdded: 0,
  stageChanges: 0,
  notesAdded: 0,
  scriptsCopied: 0,
  conversionsMarked: 0,
  lostDeals: 0,
  conversionAttempts: 0,
  missingDataWarnings: 0,
  conversions: 0,
};

function safeLog(payload: Record<string, unknown>): void {
  try {
    logInfo("[broker]", payload);
  } catch {
    /* never throw */
  }
}

export function recordBrokerProspectAdded(): void {
  state.prospectsAdded += 1;
  safeLog({ event: "prospect_added", prospectsAdded: state.prospectsAdded });
}

export function recordBrokerStageChange(from?: string, to?: string): void {
  state.stageChanges += 1;
  safeLog({ event: "stage_change", from, to, stageChanges: state.stageChanges });
}

export function recordBrokerNotesAdded(): void {
  state.notesAdded += 1;
  safeLog({ event: "notes_added", notesAdded: state.notesAdded });
}

export function recordBrokerScriptCopied(meta?: { kind?: string }): void {
  state.scriptsCopied += 1;
  safeLog({ event: "script_copied", scriptsCopied: state.scriptsCopied, ...meta });
}

export function recordBrokerConversion(): void {
  state.conversionsMarked += 1;
  state.conversions = state.conversionsMarked;
  safeLog({ event: "conversion", conversionsMarked: state.conversionsMarked });
}

export function recordBrokerLost(): void {
  state.lostDeals += 1;
  safeLog({ event: "lost", lostDeals: state.lostDeals });
}

export function recordMissingDataWarning(): void {
  state.missingDataWarnings += 1;
  safeLog({ event: "missing_contact", missingDataWarnings: state.missingDataWarnings });
}

/** Broker clicked lead unlock / paid conversion path (Stripe flow unchanged). */
export function recordBrokerConversionAttempt(input: { userId: string; leadId: string }): void {
  state.conversionAttempts += 1;
  safeLog({
    event: "broker_conversion_attempt",
    userId: input.userId,
    leadId: input.leadId,
    conversionAttempts: state.conversionAttempts,
  });
}

export function getBrokerMonitoringSnapshot(): BrokerMonitoringSnapshot {
  return { ...state, conversions: state.conversionsMarked };
}

export function resetBrokerMonitoringForTests(): void {
  state.prospectsAdded = 0;
  state.stageChanges = 0;
  state.notesAdded = 0;
  state.scriptsCopied = 0;
  state.conversionsMarked = 0;
  state.lostDeals = 0;
  state.conversionAttempts = 0;
  state.missingDataWarnings = 0;
  state.conversions = 0;
}

/** @deprecated use resetBrokerMonitoringForTests */
export function __resetBrokerMonitoringForTests(): void {
  resetBrokerMonitoringForTests();
}
