/** Internal connector codes — real BNHUB-side behavior (measured on platform). */
export const BNHUB_INTERNAL_CONNECTOR_CODES = [
  "internal_homepage",
  "internal_search_boost",
  "internal_email",
] as const;

export type BnhubInternalConnectorCode = (typeof BNHUB_INTERNAL_CONNECTOR_CODES)[number];

/** External / pending until credentials + policy (adapters return setup_required, never fake success). */
export const BNHUB_EXTERNAL_CONNECTOR_CODES = [
  "meta_ads",
  "google_ads",
  "tiktok_ads",
  "whatsapp_business",
] as const;

export function isInternalGrowthConnector(code: string): code is BnhubInternalConnectorCode {
  return (BNHUB_INTERNAL_CONNECTOR_CODES as readonly string[]).includes(code);
}

export const GROWTH_AUTONOMY_LABELS: Record<string, string> = {
  OFF: "Manual only",
  ASSISTED: "Assisted (human approvals)",
  SUPERVISED_AUTOPILOT: "Supervised autopilot",
  FULL_AUTOPILOT: "Full autopilot (high trust)",
};

export const METRIC_ATTRIBUTION_LABELS = {
  internalMeasured: "Internal — measured on BNHUB",
  connectorSynced: "Connector — synced from ad platform",
  estimated: "Estimated / model attribution",
  mockExternal: "Mock / pending external API",
} as const;
