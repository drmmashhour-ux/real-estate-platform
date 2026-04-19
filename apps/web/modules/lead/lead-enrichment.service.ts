/**
 * Merge location + light intent signals — never fabricate budget or address-level precision.
 */

import type { LeadEnrichment, LeadEnrichmentIntent, LeadEnrichmentUrgency } from "./lead-enrichment.types";
import { extractLeadLocation, type ExtractLeadLocationInput } from "./lead-location.service";
import { recordLeadEnrichmentBuilt } from "./lead-geo-enrichment-monitoring.service";

function inferIntent(leadType: string | null | undefined, message: string): LeadEnrichmentIntent {
  const m = `${leadType ?? ""} ${message}`.toLowerCase();
  if (m.includes("rent") && !m.includes("invest")) return "rent";
  if (m.includes("sell") || m.includes("vendor")) return "sell";
  if (m.includes("invest")) return "invest";
  if (m.includes("host") || m.includes("bnb")) return "host";
  if (m.includes("buy") || m.includes("purchase")) return "buy";
  return "unknown";
}

function inferUrgency(score: number, status: string | null | undefined): LeadEnrichmentUrgency {
  if (score >= 72) return "high";
  if (status === "hot" || status === "urgent") return "high";
  if (score >= 45) return "medium";
  return "low";
}

export type BuildLeadEnrichmentInput = ExtractLeadLocationInput & {
  leadType?: string | null;
  score?: number;
  status?: string | null;
  budgetRange?: string | null;
  propertyType?: string | null;
  preferredLanguage?: string | null;
  timeframe?: string | null;
};

export function buildLeadEnrichment(input: BuildLeadEnrichmentInput): LeadEnrichment {
  const location = extractLeadLocation(input);
  const intent = inferIntent(input.leadType ?? null, input.message);
  const urgency = inferUrgency(input.score ?? 0, input.status);

  const budgetRange = input.budgetRange?.trim() ? input.budgetRange.trim().slice(0, 64) : null;
  const propertyType = input.propertyType?.trim() ? input.propertyType.trim().slice(0, 80) : null;
  const language = input.preferredLanguage?.trim() ? input.preferredLanguage.trim().slice(0, 32) : null;
  const timeframe = input.timeframe?.trim() ? input.timeframe.trim().slice(0, 64) : null;

  let pts = 0;
  const maxPts = 8;
  if (location.city || location.province) pts += 2;
  if (location.city && location.province) pts += 1;
  if (location.area) pts += 1;
  if (location.postalCode) pts += 1;
  if (intent !== "unknown") pts += 1;
  if (budgetRange) pts += 1;
  if (propertyType) pts += 1;

  const completenessScore = Math.min(1, pts / maxPts);

  try {
    recordLeadEnrichmentBuilt({
      completenessScore,
      hasCity: Boolean(location.city),
      hasProvince: Boolean(location.province),
    });
  } catch {
    /* noop */
  }

  return {
    location,
    intent,
    urgency,
    budgetRange,
    propertyType,
    language,
    timeframe,
    completenessScore,
  };
}
