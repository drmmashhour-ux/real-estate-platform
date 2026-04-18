/**
 * Response desk telemetry — in-process counters; never throws.
 */

import { logInfo } from "@/lib/logger";

const LOG_PREFIX = "[autopilot:response-desk]";

const state = {
  draftsQueued: 0,
  draftsReviewed: 0,
  draftsMarkedNeedsReview: 0,
  draftsDone: 0,
  copies: 0,
  panelViews: 0,
};

export type AiResponseDeskMonitoringSnapshot = Readonly<typeof state>;

export function getAiResponseDeskMonitoringSnapshot(): AiResponseDeskMonitoringSnapshot {
  return { ...state };
}

export function resetAiResponseDeskMonitoringForTests(): void {
  state.draftsQueued = 0;
  state.draftsReviewed = 0;
  state.draftsMarkedNeedsReview = 0;
  state.draftsDone = 0;
  state.copies = 0;
  state.panelViews = 0;
}

export function recordResponseDeskDraftsQueued(n: number): void {
  try {
    state.draftsQueued += n;
    logInfo(LOG_PREFIX, { event: "drafts_queued", count: n });
  } catch {
    /* noop */
  }
}

export function recordResponseDeskReviewed(): void {
  try {
    state.draftsReviewed += 1;
    logInfo(LOG_PREFIX, { event: "marked_reviewed" });
  } catch {
    /* noop */
  }
}

export function recordResponseDeskNeedsReview(): void {
  try {
    state.draftsMarkedNeedsReview += 1;
    logInfo(LOG_PREFIX, { event: "marked_needs_review" });
  } catch {
    /* noop */
  }
}

export function recordResponseDeskDone(): void {
  try {
    state.draftsDone += 1;
    logInfo(LOG_PREFIX, { event: "marked_done" });
  } catch {
    /* noop */
  }
}

export function recordResponseDeskCopy(leadId: string): void {
  try {
    state.copies += 1;
    logInfo(LOG_PREFIX, { event: "copy", leadId });
  } catch {
    /* noop */
  }
}

export function recordResponseDeskPanelView(): void {
  try {
    state.panelViews += 1;
    logInfo(LOG_PREFIX, { event: "panel_view" });
  } catch {
    /* noop */
  }
}
