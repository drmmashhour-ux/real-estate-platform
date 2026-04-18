/**
 * Broker closing V1 — bounded counters (in-process); logs `[broker:closing]`.
 */

import { logInfo } from "@/lib/logger";

const LOG = "[broker:closing]";

export type BrokerClosingMonitoringSnapshot = {
  leadsContacted: number;
  leadsResponded: number;
  meetingsScheduled: number;
  dealsClosed: number;
  followUpsGenerated: number;
};

let state: BrokerClosingMonitoringSnapshot = {
  leadsContacted: 0,
  leadsResponded: 0,
  meetingsScheduled: 0,
  dealsClosed: 0,
  followUpsGenerated: 0,
};

export function getBrokerClosingMonitoringSnapshot(): BrokerClosingMonitoringSnapshot {
  return { ...state };
}

export function resetBrokerClosingMonitoringForTests(): void {
  state = {
    leadsContacted: 0,
    leadsResponded: 0,
    meetingsScheduled: 0,
    dealsClosed: 0,
    followUpsGenerated: 0,
  };
}

export function recordLeadContactedMonitored(): void {
  try {
    state.leadsContacted += 1;
    logInfo(`${LOG} lead_contacted`);
  } catch {
    /* noop */
  }
}

export function recordLeadRespondedMonitored(): void {
  try {
    state.leadsResponded += 1;
    logInfo(`${LOG} lead_responded`);
  } catch {
    /* noop */
  }
}

export function recordMeetingScheduledMonitored(): void {
  try {
    state.meetingsScheduled += 1;
    logInfo(`${LOG} meeting_scheduled`);
  } catch {
    /* noop */
  }
}

export function recordDealClosedMonitored(): void {
  try {
    state.dealsClosed += 1;
    logInfo(`${LOG} deal_closed`);
  } catch {
    /* noop */
  }
}

export function recordFollowUpsGeneratedMonitored(n: number): void {
  try {
    if (n > 0) state.followUpsGenerated += n;
    logInfo(`${LOG} followups_generated`, { n });
  } catch {
    /* noop */
  }
}
