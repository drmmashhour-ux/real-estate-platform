/**
 * Behavior-related fraud signals: rapid creation, unusual pricing, duplicate address/coordinates.
 */

import { prisma } from "@/lib/db";
import type { FraudReason } from "../models";

const RAPID_CREATION_HOURS = 24;
const RAPID_CREATION_COUNT = 3;

export async function checkRapidListingCreation(ownerId: string): Promise<FraudReason | null> {
  const since = new Date(Date.now() - RAPID_CREATION_HOURS * 60 * 60 * 1000);
  const count = await prisma.shortTermListing.count({
    where: { ownerId, createdAt: { gte: since } },
  });
  if (count < RAPID_CREATION_COUNT) return null;
  return {
    signal: "rapid_listing_creation",
    points: 10,
    detail: `${count} listings in ${RAPID_CREATION_HOURS}h`,
  };
}

export async function checkUnusualPricing(
  listingId: string,
  nightPriceCents: number,
  city: string
): Promise<FraudReason | null> {
  const avg = await prisma.shortTermListing.aggregate({
    where: { city: { equals: city, mode: "insensitive" }, listingStatus: "PUBLISHED" },
    _avg: { nightPriceCents: true },
    _count: true,
  });
  if (avg._count < 5 || avg._avg.nightPriceCents == null) return null;
  const ratio = nightPriceCents / avg._avg.nightPriceCents;
  if (ratio >= 0.2 && ratio <= 5) return null;
  return {
    signal: "unusual_pricing",
    points: 10,
    detail: ratio < 0.2 ? "Very low price" : "Very high price",
  };
}

export async function checkDuplicateAddress(
  listingId: string,
  address: string | null
): Promise<FraudReason | null> {
  if (!address?.trim()) return null;
  const n = address.trim().toLowerCase().replace(/\s+/g, " ");
  const others = await prisma.shortTermListing.findMany({
    where: {
      id: { not: listingId },
      listingVerificationStatus: { not: "REJECTED" },
    },
    select: { address: true },
    take: 500,
  });
  for (const other of others) {
    const otherNorm = other.address.trim().toLowerCase().replace(/\s+/g, " ");
    if (otherNorm === n || otherNorm.includes(n) || n.includes(otherNorm)) {
      return { signal: "duplicate_address", points: 30, detail: "Same or very similar address" };
    }
  }
  return null;
}

export async function checkDuplicateCoordinates(
  listingId: string,
  lat: number | null,
  lon: number | null
): Promise<FraudReason | null> {
  if (lat == null || lon == null) return null;
  const tolerance = 0.0001;
  const other = await prisma.shortTermListing.findFirst({
    where: {
      id: { not: listingId },
      latitude: { gte: lat - tolerance, lte: lat + tolerance },
      longitude: { gte: lon - tolerance, lte: lon + tolerance },
      listingVerificationStatus: { not: "REJECTED" },
    },
    select: { id: true },
  });
  if (!other) return null;
  return { signal: "duplicate_coordinates", points: 25 };
}
