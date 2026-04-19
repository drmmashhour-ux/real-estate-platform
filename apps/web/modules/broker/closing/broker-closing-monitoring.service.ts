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
  nextActionsComputed: number;
  quickActionsUsed: number;
  followUpDraftsOpened: number;
  topThreeListsGenerated: number;
};

let state: BrokerClosingMonitoringSnapshot = {
  leadsContacted: 0,
  leadsResponded: 0,
  meetingsScheduled: 0,
  dealsClosed: 0,
  followUpsGenerated: 0,
  nextActionsComputed: 0,
  quickActionsUsed: 0,
  followUpDraftsOpened: 0,
  topThreeListsGenerated: 0,
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
    nextActionsComputed: 0,
    quickActionsUsed: 0,
    followUpDraftsOpened: 0,
    topThreeListsGenerated: 0,
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

export function recordNextActionsComputedMonitored(n: number): void {
  try {
    if (n > 0) state.nextActionsComputed += n;
    logInfo(`${LOG} next_actions_computed`, { n });
  } catch {
    /* noop */
  }
}

export function recordQuickActionUsedMonitored(action: string): void {
  try {
    state.quickActionsUsed += 1;
    logInfo(`${LOG} quick_action`, { action });
  } catch {
    /* noop */
  }
}

export function recordFollowUpDraftOpenedMonitored(): void {
  try {
    state.followUpDraftsOpened += 1;
    logInfo(`${LOG} followup_draft_opened`);
  } catch {
    /* noop */
  }
}

export function recordTopThreeGeneratedMonitored(): void {
  try {
    state.topThreeListsGenerated += 1;
    logInfo(`${LOG} top_three_generated`);
  } catch {
    /* noop */
  }
}
