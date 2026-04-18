/**
 * Test + operator verification helpers for in-process conversion monitoring (advisory).
 * Does not persist; safe to call from tests and admin debug routes.
 */

import type { ConversionMonitoringState } from "@/modules/conversion/conversion-monitoring.service";

export type ConversionMonitoringSnapshot = ConversionMonitoringState;

export const CONVERSION_MONITORING_KEYS = [
  "heroClicks",
  "intentSelections",
  "leadFormStarts",
  "leadSubmits",
  "listingCtaClicks",
  "propertyCtaClicks",
  "brokerPreviewCtaClicks",
] as const;

/** Maps monitoring counter → human intent for QA docs / assertions. */
export const CONVERSION_EVENT_VERIFICATION_MAP: Record<
  (typeof CONVERSION_MONITORING_KEYS)[number],
  { firesOn: string; typicalSurface: string }
> = {
  heroClicks: { firesOn: "recordConversionHeroClick", typicalSurface: "marketing hero CTAs" },
  intentSelections: { firesOn: "recordIntentSelection", typicalSurface: "intent controls" },
  leadFormStarts: { firesOn: "recordLeadFormStart", typicalSurface: "/get-leads first focus" },
  leadSubmits: { firesOn: "recordLeadSubmit", typicalSurface: "/get-leads successful POST" },
  listingCtaClicks: { firesOn: "recordListingCtaClick", typicalSurface: "listings grid opportunity / view" },
  propertyCtaClicks: { firesOn: "recordPropertyCtaClick", typicalSurface: "listing detail CTAs" },
  brokerPreviewCtaClicks: { firesOn: "recordBrokerPreviewCtaClick", typicalSurface: "broker lead preview" },
};

export function formatConversionMonitoringSnapshot(s: ConversionMonitoringSnapshot): string {
  const lines = CONVERSION_MONITORING_KEYS.map((k) => `${k}: ${s[k]}`);
  lines.push(`surfaceViewsByKey: ${JSON.stringify(s.surfaceViewsByKey ?? {})}`);
  return lines.join("\n");
}
