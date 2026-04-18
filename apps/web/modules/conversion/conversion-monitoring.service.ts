/**
 * Lightweight in-process conversion counters for Instant Value / Conversion V1 (advisory; not billing).
 */

import { logInfo } from "@/lib/logger";

type State = {
  heroClicks: number;
  intentSelections: number;
  leadFormStarts: number;
  leadSubmits: number;
  listingCtaClicks: number;
  propertyCtaClicks: number;
  brokerPreviewCtaClicks: number;
};

const state: State = {
  heroClicks: 0,
  intentSelections: 0,
  leadFormStarts: 0,
  leadSubmits: 0,
  listingCtaClicks: 0,
  propertyCtaClicks: 0,
  brokerPreviewCtaClicks: 0,
};

function safeLog(payload: Record<string, unknown>): void {
  try {
    logInfo("[conversion]", payload);
  } catch {
    /* never throw */
  }
}

export function recordConversionHeroClick(meta?: Record<string, unknown>): void {
  try {
    state.heroClicks += 1;
    safeLog({ event: "hero_click", ...meta, heroClicks: state.heroClicks });
  } catch {
    /* noop */
  }
}

export function recordIntentSelection(meta?: Record<string, unknown>): void {
  try {
    state.intentSelections += 1;
    safeLog({ event: "intent_selection", ...meta, intentSelections: state.intentSelections });
  } catch {
    /* noop */
  }
}

export function recordLeadFormStart(meta?: Record<string, unknown>): void {
  try {
    state.leadFormStarts += 1;
    safeLog({ event: "lead_form_start", ...meta, leadFormStarts: state.leadFormStarts });
  } catch {
    /* noop */
  }
}

export function recordLeadSubmit(meta?: Record<string, unknown>): void {
  try {
    state.leadSubmits += 1;
    safeLog({ event: "lead_submit", ...meta, leadSubmits: state.leadSubmits });
  } catch {
    /* noop */
  }
}

export function recordListingCtaClick(meta?: Record<string, unknown>): void {
  try {
    state.listingCtaClicks += 1;
    safeLog({ event: "listing_cta_click", ...meta, listingCtaClicks: state.listingCtaClicks });
  } catch {
    /* noop */
  }
}

export function recordPropertyCtaClick(meta?: Record<string, unknown>): void {
  try {
    state.propertyCtaClicks += 1;
    safeLog({ event: "property_cta_click", ...meta, propertyCtaClicks: state.propertyCtaClicks });
  } catch {
    /* noop */
  }
}

export function recordBrokerPreviewCtaClick(meta?: Record<string, unknown>): void {
  try {
    state.brokerPreviewCtaClicks += 1;
    safeLog({ event: "broker_preview_cta_click", ...meta, brokerPreviewCtaClicks: state.brokerPreviewCtaClicks });
  } catch {
    /* noop */
  }
}

export function getConversionMonitoringSnapshot(): State {
  return { ...state };
}

export function resetConversionMonitoringForTests(): void {
  state.heroClicks = 0;
  state.intentSelections = 0;
  state.leadFormStarts = 0;
  state.leadSubmits = 0;
  state.listingCtaClicks = 0;
  state.propertyCtaClicks = 0;
  state.brokerPreviewCtaClicks = 0;
}
