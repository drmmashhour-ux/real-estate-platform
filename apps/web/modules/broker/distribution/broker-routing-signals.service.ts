/**
 * Deterministic signal extraction for lead ↔ broker routing — sparse data lowers confidence.
 */

import { prisma } from "@/lib/db";
import { extractEvaluationSnapshot } from "@/lib/leads/timeline-helpers";
import { leadGeoRoutingFlags } from "@/config/feature-flags";
import type {
  BrokerLeadRoutingConfidenceLevel,
  BrokerLeadRoutingSignals,
} from "./broker-lead-distribution.types";
import { extractLeadLocation } from "@/modules/lead/lead-location.service";
import type { LeadLocation } from "@/modules/lead/lead-location.types";
import { buildLeadEnrichment } from "@/modules/lead/lead-enrichment.service";

function inferUrgency(score: number | null | undefined, status: string | null | undefined): "low" | "medium" | "high" {
  if (score != null && score >= 72) return "high";
  if (status === "hot" || status === "urgent") return "high";
  if (score != null && score >= 45) return "medium";
  return "low";
}

function leadGeoResolution(loc: LeadLocation): {
  geoMatchScore: number;
  geoMatchType: "resolved" | "partial" | "unknown";
  geoExplanation: string;
} {
  const hasCity = Boolean(loc.city?.trim());
  const hasProv = Boolean(loc.province?.trim());
  if (hasCity && hasProv) {
    return {
      geoMatchScore: loc.confidenceLevel === "high" ? 0.95 : 0.82,
      geoMatchType: "resolved",
      geoExplanation: `Lead location resolved (${loc.city}, ${loc.province}).`,
    };
  }
  if (hasCity || hasProv || loc.postalCode?.trim()) {
    return {
      geoMatchScore: loc.confidenceLevel === "medium" ? 0.68 : 0.52,
      geoMatchType: "partial",
      geoExplanation: hasCity
        ? `Partial location — city known (${loc.city}); region may be incomplete.`
        : `Partial location — region or postal hint only.`,
    };
  }
  return {
    geoMatchScore: 0.22,
    geoMatchType: "unknown",
    geoExplanation: "Lead location unknown — geo routing uses neutral fallback.",
  };
}

export type LeadRoutingSignalRow = {
  id: string;
  leadType: string | null;
  message: string;
  purchaseRegion: string | null;
  aiExplanation: unknown;
  score: number;
  status: string;
  userId: string | null;
  user: { preferredUiLocale: string | null } | null;
};

export async function loadLeadForRoutingSignals(
  leadId: string,
): Promise<(LeadRoutingSignalRow & { introducedByBrokerId: string | null }) | null> {
  return prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      leadType: true,
      message: true,
      purchaseRegion: true,
      aiExplanation: true,
      score: true,
      status: true,
      introducedByBrokerId: true,
      userId: true,
      user: { select: { preferredUiLocale: true } },
    },
  });
}

/** Lead-level signals for docs + audit (not per-broker). */
export function buildLeadLevelRoutingSignals(lead: LeadRoutingSignalRow): {
  signals: Omit<
    BrokerLeadRoutingSignals,
    "brokerPerformanceScore" | "followUpHealth" | "brokerAvailability" | "recentLoad"
  >;
  sparseNotes: string[];
  leadLocation: LeadLocation;
} {
  const sparseNotes: string[] = [];
  const snap = extractEvaluationSnapshot(lead.aiExplanation);

  const useEnrichment = leadGeoRoutingFlags.leadEnrichmentV1 || leadGeoRoutingFlags.geoRoutingV1;
  const enrichment = useEnrichment
    ? buildLeadEnrichment({
        message: lead.message,
        purchaseRegion: lead.purchaseRegion,
        aiExplanation: lead.aiExplanation,
        leadType: lead.leadType,
        score: lead.score,
        status: lead.status,
        propertyType: snap?.propertyType ?? undefined,
      })
    : null;

  const leadLocation = enrichment?.location ?? extractLeadLocation({
    message: lead.message,
    purchaseRegion: lead.purchaseRegion,
    aiExplanation: lead.aiExplanation,
  });

  const city = leadLocation.city ?? snap?.city?.trim() ?? null;
  const propertyType =
    enrichment?.propertyType?.trim() || snap?.propertyType?.trim() || null;
  const area = leadLocation.area ?? lead.purchaseRegion?.trim() ?? null;

  if (!city && !area) {
    sparseNotes.push("City/region signals are thin — geographic matching uses lower confidence.");
  }

  let confidenceLevel: BrokerLeadRoutingConfidenceLevel = "medium";
  if (!city && !area && !lead.leadType) confidenceLevel = "insufficient";
  else if (!city || !lead.leadType) confidenceLevel = "low";

  const geoMeta = leadGeoRoutingFlags.geoRoutingV1 ? leadGeoResolution(leadLocation) : null;

  const signals: Omit<
    BrokerLeadRoutingSignals,
    "brokerPerformanceScore" | "followUpHealth" | "brokerAvailability" | "recentLoad"
  > = {
    leadType: lead.leadType,
    city,
    area,
    propertyType,
    urgency: inferUrgency(lead.score, lead.status),
    confidenceLevel,
    ...(geoMeta
      ? {
          geoMatchScore: geoMeta.geoMatchScore,
          geoMatchType: geoMeta.geoMatchType,
          geoExplanation: geoMeta.geoExplanation,
          leadLocation,
        }
      : {}),
  };

  return { signals, sparseNotes, leadLocation };
}

/**
 * When declared profiles were not loaded for the pool, availability/capacity ceilings stay neutral.
 */
export function availabilityRoutingSparseHint(declaredProfilesLoaded: boolean): string | undefined {
  if (!declaredProfilesLoaded) {
    return "Availability/capacity routing layers had no declared profile batch — ceilings default neutral (unknown).";
  }
  return undefined;
}
