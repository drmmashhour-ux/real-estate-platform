/**
 * In-process ring buffer for journey analytics events — survives only within one Node runtime.
 * Durable persistence can replace this adapter without changing repository contracts.
 */

import type { JourneyAnalyticsEventPayload } from "./journey-analytics.types";

const MAX = 50_000;
const buffer: JourneyAnalyticsEventPayload[] = [];

export function appendJourneyAnalyticsEvent(ev: JourneyAnalyticsEventPayload): void {
  try {
    buffer.push(ev);
    while (buffer.length > MAX) buffer.shift();
  } catch {
    /* noop */
  }
}

export function snapshotJourneyAnalyticsEvents(): JourneyAnalyticsEventPayload[] {
  try {
    return [...buffer];
  } catch {
    return [];
  }
}

/** Test-only reset */
export function resetJourneyAnalyticsMemoryStoreForTests(): void {
  try {
    buffer.length = 0;
  } catch {
    /* noop */
  }
}
