import { prisma } from "@/lib/db";
import { recordPlatformEvent } from "@/lib/observability";
import { stubGeocodingProvider, geocodePrecisionScore } from "@/lib/trustgraph/infrastructure/services/geocodingValidationService";

export type GeospatialPersistResult = {
  precisionScore: number | null;
  cityMatch: boolean | null;
  warnings: string[];
};

export async function validateAndPersistGeospatialForListing(listingId: string): Promise<GeospatialPersistResult> {
  const listing = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: { address: true, city: true, latitude: true, longitude: true },
  });
  if (!listing) {
    return { precisionScore: null, cityMatch: null, warnings: ["listing_not_found"] };
  }

  const summary = stubGeocodingProvider.normalizeFromListing({
    address: listing.address,
    city: listing.city,
    latitude: listing.latitude,
    longitude: listing.longitude,
  });
  const precisionScore = geocodePrecisionScore(summary);
  const cityNorm = listing.city.trim().toLowerCase();
  const matched = summary.matchedCity?.trim().toLowerCase() ?? "";
  const cityMatch = matched.length > 0 ? cityNorm === matched : null;

  const warnings: string[] = [];
  if (precisionScore < 0.5) warnings.push("weak_geocode_precision");
  if (cityMatch === false) warnings.push("city_mismatch_vs_geocode");

  const row = await prisma.trustgraphGeospatialValidation.upsert({
    where: { fsboListingId: listingId },
    create: {
      fsboListingId: listingId,
      providerSummary: { provider: summary.provider, version: summary.version, precision: summary.precision },
      precisionScore,
      cityMatch,
      warnings: warnings as object,
    },
    update: {
      providerSummary: { provider: summary.provider, version: summary.version, precision: summary.precision },
      precisionScore,
      cityMatch,
      warnings: warnings as object,
    },
  });

  void recordPlatformEvent({
    eventType: "trustgraph_geospatial_validation_run",
    sourceModule: "trustgraph",
    entityType: "FSBO_LISTING",
    entityId: listingId,
    payload: {
      precisionScore: row.precisionScore,
      cityMatch: row.cityMatch,
      warningCount: warnings.length,
    },
  }).catch(() => {});

  return {
    precisionScore: row.precisionScore,
    cityMatch: row.cityMatch,
    warnings,
  };
}
