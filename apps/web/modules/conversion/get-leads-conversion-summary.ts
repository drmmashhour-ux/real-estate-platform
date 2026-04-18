/**
 * Pure helpers for /get-leads conversion + instant-value layering (tests + client).
 */

import { buildInstantValueSummary } from "@/modules/conversion/instant-value.service";
import type { InstantValueIntent, InstantValueSummary } from "@/modules/conversion/instant-value.types";

/**
 * Mirrors GetLeadsPageClient: upgrade off → null; upgrade + IV off → summary with empty insights;
 * full IV → full insight list.
 */
export function resolveGetLeadsIvSummaryLayer(
  conversionUpgradeV1: boolean,
  instantValueV1: boolean,
  intent: InstantValueIntent,
): InstantValueSummary | null {
  if (!conversionUpgradeV1) return null;
  const full = buildInstantValueSummary({ page: "leads", intent });
  if (!instantValueV1) return { ...full, insights: [] };
  return full;
}
