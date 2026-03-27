import { prisma } from "@/lib/db";
import { dealAnalyzerConfig } from "@/config/dealAnalyzer";
import type { ComparableCandidate, ComparableWithScore } from "@/modules/deal-analyzer/domain/comparables";
import { distanceKmBetween, scoreComparableSimilarity } from "@/modules/deal-analyzer/infrastructure/services/comparableScoringService";

export type ComparableSearchOverrides = {
  priceBandFraction?: number;
  maxCandidates?: number;
  /** When set, drop candidates farther than this (km) when both have coordinates. */
  maxRadiusKm?: number;
};

export async function findComparableFsboListings(
  subjectListingId: string,
  overrides?: ComparableSearchOverrides | null,
): Promise<{
  subject: ComparableCandidate | null;
  comparables: ComparableCandidate[];
}> {
  const subject = await prisma.fsboListing.findUnique({
    where: { id: subjectListingId },
    select: {
      id: true,
      city: true,
      priceCents: true,
      propertyType: true,
      bedrooms: true,
      bathrooms: true,
      surfaceSqft: true,
      status: true,
      moderationStatus: true,
      listingDealType: true,
      latitude: true,
      longitude: true,
    },
  });

  if (!subject) {
    return { subject: null, comparables: [] };
  }

  const band = overrides?.priceBandFraction ?? dealAnalyzerConfig.comparable.priceBandFraction;
  const lowPrice = Math.max(1, Math.floor(subject.priceCents * (1 - band)));
  const highPrice = Math.floor(subject.priceCents * (1 + band));
  const maxTake = overrides?.maxCandidates ?? dealAnalyzerConfig.comparable.maxCandidates;

  const rows = await prisma.fsboListing.findMany({
    where: {
      id: { not: subjectListingId },
      city: subject.city,
      status: "ACTIVE",
      moderationStatus: "APPROVED",
      listingDealType: subject.listingDealType,
      priceCents: { gte: lowPrice, lte: highPrice },
    },
    take: maxTake,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      priceCents: true,
      propertyType: true,
      bedrooms: true,
      bathrooms: true,
      surfaceSqft: true,
      status: true,
      latitude: true,
      longitude: true,
    },
  });

  const subjectCandidate: ComparableCandidate = {
    id: subject.id,
    priceCents: subject.priceCents,
    pricePerSqft:
      subject.surfaceSqft && subject.surfaceSqft > 0
        ? subject.priceCents / 100 / subject.surfaceSqft
        : null,
    propertyType: subject.propertyType,
    bedrooms: subject.bedrooms,
    bathrooms: subject.bathrooms,
    areaSqft: subject.surfaceSqft,
    listingStatus: subject.status,
    latitude: subject.latitude,
    longitude: subject.longitude,
  };

  let comparables: ComparableCandidate[] = rows.map((r) => ({
    id: r.id,
    priceCents: r.priceCents,
    pricePerSqft:
      r.surfaceSqft && r.surfaceSqft > 0 ? r.priceCents / 100 / r.surfaceSqft : null,
    propertyType: r.propertyType,
    bedrooms: r.bedrooms,
    bathrooms: r.bathrooms,
    areaSqft: r.surfaceSqft,
    listingStatus: r.status,
    latitude: r.latitude,
    longitude: r.longitude,
  }));

  const maxR = overrides?.maxRadiusKm;
  if (maxR != null && maxR > 0) {
    comparables = comparables.filter((c) => {
      const d = distanceKmBetween(subjectCandidate, c);
      if (d == null) return true;
      return d <= maxR;
    });
  }

  return { subject: subjectCandidate, comparables };
}

export function toComparableWithScores(
  ranked: { candidate: ComparableCandidate; similarityScore: number; distanceKm: number | null }[],
): ComparableWithScore[] {
  return ranked.map((r) => ({
    ...r.candidate,
    similarityScore: r.similarityScore,
    distanceKm: r.distanceKm,
  }));
}

export function rankComparablesBySimilarity(
  subject: ComparableCandidate,
  comparables: ComparableCandidate[],
): { candidate: ComparableCandidate; similarityScore: number; distanceKm: number | null }[] {
  return comparables
    .map((candidate) => {
      const similarityScore = scoreComparableSimilarity(subject, candidate);
      const distanceKm = distanceKmBetween(subject, candidate);
      return { candidate, similarityScore, distanceKm };
    })
    .sort((a, b) => b.similarityScore - a.similarityScore);
}
