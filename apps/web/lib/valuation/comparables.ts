/**
 * Comparable property analysis: find similar listings and compute weights.
 */

import { prisma } from "@/lib/db";
import type { PropertyInput } from "./types";
import type { ComparableRecord } from "./types";

const MAX_COMPARABLES = 10;
const MAX_DISTANCE_KM = 50;
const BEDROOM_MISMATCH_PENALTY = 0.2;
const BATH_MISMATCH_PENALTY = 0.1;

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function findComparableListings(
  input: PropertyInput,
  limit: number = MAX_COMPARABLES
): Promise<ComparableRecord[]> {
  const hasCoords = input.latitude != null && input.longitude != null;
  const listings = await prisma.shortTermListing.findMany({
    where: {
      listingStatus: "PUBLISHED",
      id: input.listingId ? { not: input.listingId } : undefined,
      city: { equals: input.city, mode: "insensitive" },
      ...(input.propertyType
        ? { propertyType: { equals: input.propertyType, mode: "insensitive" } }
        : {}),
      ...(input.bedrooms != null ? { beds: { gte: Math.max(1, input.bedrooms - 1), lte: input.bedrooms + 1 } } : {}),
    },
    select: {
      id: true,
      nightPriceCents: true,
      city: true,
      beds: true,
      baths: true,
      latitude: true,
      longitude: true,
      listingStatus: true,
    },
    take: limit * 2,
  });

  const withScores = listings.map((l) => {
    let weight = 1;
    let reason = "Same city";
    if (input.bedrooms != null && l.beds != null) {
      const bedDiff = Math.abs(l.beds - input.bedrooms);
      if (bedDiff > 0) weight -= BEDROOM_MISMATCH_PENALTY * bedDiff;
      reason += `, ${l.beds} bed`;
    }
    if (input.bathrooms != null && l.baths != null) {
      const bathDiff = Math.abs(l.baths - input.bathrooms);
      if (bathDiff > 0) weight -= BATH_MISMATCH_PENALTY * bathDiff;
    }
    let distance: number | undefined;
    if (hasCoords && input.latitude != null && input.longitude != null && l.latitude != null && l.longitude != null) {
      distance = haversineKm(input.latitude, input.longitude, l.latitude, l.longitude);
      if (distance > MAX_DISTANCE_KM) return null;
      weight *= Math.max(0.3, 1 - distance / MAX_DISTANCE_KM);
      reason += `, ${distance.toFixed(1)} km`;
    }
    return {
      id: l.id,
      source: "listing" as const,
      nightlyRateCents: l.nightPriceCents,
      city: l.city,
      bedrooms: l.beds,
      bathrooms: l.baths,
      distance,
      weight: Math.max(0.1, weight),
      reason,
    };
  }).filter(Boolean) as ComparableRecord[];

  withScores.sort((a, b) => b.weight - a.weight);
  return withScores.slice(0, limit);
}

export function summarizeComparables(comparables: ComparableRecord[]): Record<string, unknown> {
  const withPrice = comparables.filter((c) => c.nightlyRateCents != null || c.priceCents != null || c.monthlyRentCents != null);
  const avgNightly = withPrice.length
    ? withPrice.reduce((s, c) => s + (c.nightlyRateCents ?? c.priceCents ?? 0), 0) / withPrice.length
    : null;
  const avgRent = withPrice.filter((c) => c.monthlyRentCents != null).length
    ? withPrice.reduce((s, c) => s + (c.monthlyRentCents ?? 0), 0) / withPrice.filter((c) => c.monthlyRentCents != null).length
    : null;
  return {
    count: comparables.length,
    avgNightlyRateCents: avgNightly,
    avgMonthlyRentCents: avgRent,
    selectedReasons: comparables.map((c) => c.reason),
  };
}
