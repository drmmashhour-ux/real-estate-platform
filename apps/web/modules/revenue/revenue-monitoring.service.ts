/**
 * In-process counters for Revenue Enforcement V1 (best-effort; not durable across instances).
 */

import { logInfo } from "@/lib/logger";
import type { RevenueEventType } from "@/modules/revenue/revenue-events.types";

export type RevenueMonitoringSnapshot = {
  eventsLogged: number;
  blockedAccessCount: number;
  unlockAttempts: number;
  unlockSuccess: number;
  leadViews: number;
  leadsUnlockedPipeline: number;
  contactRevealed: number;
  bookingStarted: number;
  bookingCompleted: number;
  premiumInsightViews: number;
  byEventType: Partial<Record<RevenueEventType, number>>;
};

const state = {
  eventsLogged: 0,
  blockedAccessCount: 0,
  unlockAttempts: 0,
  unlockSuccess: 0,
  leadViews: 0,
  leadsUnlockedPipeline: 0,
  contactRevealed: 0,
  bookingStarted: 0,
  bookingCompleted: 0,
  premiumInsightViews: 0,
  byEventType: {} as Partial<Record<RevenueEventType, number>>,
};

function bumpType(t: RevenueEventType) {
  state.byEventType[t] = (state.byEventType[t] ?? 0) + 1;
}

export function recordRevenueMonitoringEvent(type: RevenueEventType): void {
  state.eventsLogged += 1;
  bumpType(type);
  switch (type) {
    case "lead_viewed":
      state.leadViews += 1;
      break;
    case "lead_unlocked":
      state.leadsUnlockedPipeline += 1;
      state.unlockSuccess += 1;
      break;
    case "contact_revealed":
      state.contactRevealed += 1;
      break;
    case "booking_started":
      state.bookingStarted += 1;
      break;
    case "booking_completed":
      state.bookingCompleted += 1;
      break;
    case "premium_insight_viewed":
      state.premiumInsightViews += 1;
      break;
    default:
      break;
  }
}

export function recordUnlockAttempt(): void {
  state.unlockAttempts += 1;
}

export function recordBlockedAccess(reason?: string): void {
  state.blockedAccessCount += 1;
  logInfo("[revenue]", { event: "blocked_access", reason: reason ?? "unspecified" });
}

export function getRevenueMonitoringSnapshot(): RevenueMonitoringSnapshot {
  return {
    eventsLogged: state.eventsLogged,
    blockedAccessCount: state.blockedAccessCount,
    unlockAttempts: state.unlockAttempts,
    unlockSuccess: state.unlockSuccess,
    leadViews: state.leadViews,
    leadsUnlockedPipeline: state.leadsUnlockedPipeline,
    contactRevealed: state.contactRevealed,
    bookingStarted: state.bookingStarted,
    bookingCompleted: state.bookingCompleted,
    premiumInsightViews: state.premiumInsightViews,
    byEventType: { ...state.byEventType },
  };
}

/** Test-only reset. */
export function __resetRevenueMonitoringForTests(): void {
  state.eventsLogged = 0;
  state.blockedAccessCount = 0;
  state.unlockAttempts = 0;
  state.unlockSuccess = 0;
  state.leadViews = 0;
  state.leadsUnlockedPipeline = 0;
  state.contactRevealed = 0;
  state.bookingStarted = 0;
  state.bookingCompleted = 0;
  state.premiumInsightViews = 0;
  state.byEventType = {};
}
