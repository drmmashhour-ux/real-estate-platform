/**
 * Lightweight in-process conversion counters for Instant Value / Conversion V1 (advisory; not billing).
 */

import { logInfo } from "@/lib/logger";
import { recordFunnelEvent } from "@/modules/conversion/funnel-metrics.service";

export type ConversionMonitoringState = {
  heroClicks: number;
  intentSelections: number;
  leadFormStarts: number;
  leadSubmits: number;
  listingCtaClicks: number;
  propertyCtaClicks: number;
  brokerPreviewCtaClicks: number;
  /** Advisory surface impressions (e.g. get-leads loaded with conversion on). */
  surfaceViewsByKey: Record<string, number>;
};

type State = ConversionMonitoringState;

const state: State = {
  heroClicks: 0,
  intentSelections: 0,
  leadFormStarts: 0,
  leadSubmits: 0,
  listingCtaClicks: 0,
  propertyCtaClicks: 0,
  brokerPreviewCtaClicks: 0,
  surfaceViewsByKey: {},
};

/** Last N debug events — only populated when NEXT_PUBLIC_CONVERSION_MONITORING_DEBUG=1 (browser bundle). */
export type ConversionMonitoringDebugEvent = { ts: string; kind: string; meta?: Record<string, unknown> };
let recentDebugEvents: ConversionMonitoringDebugEvent[] = [];

function monitoringDebugEnabled(): boolean {
  return typeof process !== "undefined" && process.env.NEXT_PUBLIC_CONVERSION_MONITORING_DEBUG === "1";
}

function pushDebug(kind: string, meta?: Record<string, unknown>): void {
  if (!monitoringDebugEnabled()) return;
  recentDebugEvents = [...recentDebugEvents.slice(-49), { ts: new Date().toISOString(), kind, meta }];
}

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
    if (meta?.surface === "home") recordFunnelEvent("homepage", "CTA_click");
    pushDebug("hero_click", meta);
    safeLog({ event: "hero_click", ...meta, heroClicks: state.heroClicks });
  } catch {
    /* noop */
  }
}

export function recordIntentSelection(meta?: Record<string, unknown>): void {
  try {
    state.intentSelections += 1;
    pushDebug("intent_selection", meta);
    safeLog({ event: "intent_selection", ...meta, intentSelections: state.intentSelections });
  } catch {
    /* noop */
  }
}

/** Same-tab fallback when sessionStorage is blocked (still one logical session key per surface). */
const leadFormStartDedupFallback = new Set<string>();

export function recordLeadFormStart(meta?: Record<string, unknown>): void {
  try {
    if (typeof window === "undefined") return;
    if (!meta || typeof meta.surface !== "string" || !meta.surface.trim()) {
      safeLog({ event: "conversion_guard_skipped", kind: "lead_form_start", reason: "missing_surface" });
      return;
    }
    const surface = meta.surface.trim();
    try {
      const k = `conv:lfs:${surface}`;
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, "1");
    } catch {
      if (leadFormStartDedupFallback.has(surface)) return;
      leadFormStartDedupFallback.add(surface);
    }
    state.leadFormStarts += 1;
    pushDebug("lead_form_start", meta);
    safeLog({ event: "lead_form_start", ...meta, leadFormStarts: state.leadFormStarts });
  } catch {
    /* noop */
  }
}

export function recordLeadSubmit(meta?: Record<string, unknown>): void {
  try {
    if (!meta || typeof meta.surface !== "string" || !meta.surface.trim()) {
      safeLog({ event: "conversion_guard_skipped", kind: "lead_submit", reason: "missing_surface" });
      return;
    }
    state.leadSubmits += 1;
    pushDebug("lead_submit", meta);
    safeLog({ event: "lead_submit", ...meta, leadSubmits: state.leadSubmits });
  } catch {
    /* noop */
  }
}

/** Increment when a conversion surface is shown (used for rollout alerts vs submits). */
export function recordConversionSurfaceView(surfaceKey: string): void {
  try {
    const k = surfaceKey.trim() || "unknown";
    state.surfaceViewsByKey[k] = (state.surfaceViewsByKey[k] ?? 0) + 1;
    pushDebug("surface_view", { surface: k });
    safeLog({ event: "surface_view", surface: k, count: state.surfaceViewsByKey[k] });
  } catch {
    /* noop */
  }
}

export function recordListingCtaClick(meta?: Record<string, unknown>): void {
  try {
    if (!meta || typeof meta.surface !== "string" || !meta.surface.trim()) {
      safeLog({ event: "conversion_guard_skipped", kind: "listing_cta", reason: "missing_surface" });
      return;
    }
    const lid = meta.listingId;
    if (lid == null || (typeof lid !== "string" && typeof lid !== "number")) {
      safeLog({ event: "conversion_guard_skipped", kind: "listing_cta", reason: "missing_listingId" });
      return;
    }
    state.listingCtaClicks += 1;
    recordFunnelEvent("listings", "CTA_click");
    try {
      if (typeof window !== "undefined") {
        const prev = Number.parseInt(sessionStorage.getItem("conv:listing_clicks") ?? "0", 10) || 0;
        sessionStorage.setItem("conv:listing_clicks", String(prev + 1));
      }
    } catch {
      /* ignore */
    }
    pushDebug("listing_cta_click", meta);
    safeLog({ event: "listing_cta_click", ...meta, listingCtaClicks: state.listingCtaClicks });
  } catch {
    /* noop */
  }
}

export function recordPropertyCtaClick(meta?: Record<string, unknown>): void {
  try {
    if (!meta || typeof meta.surface !== "string" || !meta.surface.trim()) {
      safeLog({ event: "conversion_guard_skipped", kind: "property_cta", reason: "missing_surface" });
      return;
    }
    const lid = meta.listingId;
    if (lid == null || (typeof lid !== "string" && typeof lid !== "number")) {
      safeLog({ event: "conversion_guard_skipped", kind: "property_cta", reason: "missing_listingId" });
      return;
    }
    state.propertyCtaClicks += 1;
    recordFunnelEvent("property", "contact_click");
    pushDebug("property_cta_click", meta);
    safeLog({ event: "property_cta_click", ...meta, propertyCtaClicks: state.propertyCtaClicks });
  } catch {
    /* noop */
  }
}

export function recordBrokerPreviewCtaClick(meta?: Record<string, unknown>): void {
  try {
    if (!meta || typeof meta.surface !== "string" || !meta.surface.trim()) {
      safeLog({ event: "conversion_guard_skipped", kind: "broker_preview_cta", reason: "missing_surface" });
      return;
    }
    state.brokerPreviewCtaClicks += 1;
    recordFunnelEvent("broker_preview", "CTA_click");
    pushDebug("broker_preview_cta_click", meta);
    safeLog({ event: "broker_preview_cta_click", ...meta, brokerPreviewCtaClicks: state.brokerPreviewCtaClicks });
  } catch {
    /* noop */
  }
}

export function getConversionMonitoringSnapshot(): State {
  return { ...state };
}

export function getConversionMonitoringRecentEvents(): ConversionMonitoringDebugEvent[] {
  return [...recentDebugEvents];
}

export function resetConversionMonitoringForTests(): void {
  state.heroClicks = 0;
  state.intentSelections = 0;
  state.leadFormStarts = 0;
  state.leadSubmits = 0;
  state.listingCtaClicks = 0;
  state.propertyCtaClicks = 0;
  state.brokerPreviewCtaClicks = 0;
  state.surfaceViewsByKey = {};
  recentDebugEvents = [];
  leadFormStartDedupFallback.clear();
}
