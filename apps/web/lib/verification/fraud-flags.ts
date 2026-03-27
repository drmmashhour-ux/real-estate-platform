/**
 * Fraud prevention: automatic flags for duplicate cadastre,
 * mismatched owner names, multiple listings from same user, suspicious patterns.
 */

import { prisma } from "@/lib/db";

export type FraudFlag = {
  code: string;
  severity: "low" | "medium" | "high";
  message: string;
  listingId?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Check for duplicate cadastre across active listings (owner-only).
 */
export async function flagDuplicateCadastre(
  cadastreNumber: string,
  excludeListingId?: string
): Promise<FraudFlag | null> {
  const normalized = (cadastreNumber ?? "").trim();
  if (!normalized) return null;
  const existing = await prisma.shortTermListing.findFirst({
    where: {
      cadastreNumber: normalized,
      listingAuthorityType: "OWNER",
      listingVerificationStatus: { in: ["PENDING_VERIFICATION", "VERIFIED"] },
      id: excludeListingId ? { not: excludeListingId } : undefined,
    },
    select: { id: true },
  });
  if (!existing) return null;
  return {
    code: "DUPLICATE_CADASTRE",
    severity: "high",
    message: "Another active listing already uses this cadastre number.",
    listingId: existing.id,
    metadata: { cadastreNumber: normalized },
  };
}

/**
 * Flag when owner name on document does not match user name (caller provides extracted name).
 */
export function flagOwnerNameMismatch(
  documentOwnerName: string,
  userDisplayName: string | null,
  listingId: string
): FraudFlag | null {
  if (!documentOwnerName?.trim()) return null;
  const docNorm = documentOwnerName.trim().toLowerCase();
  const userNorm = (userDisplayName ?? "").trim().toLowerCase();
  if (!userNorm) return null;
  // Simple containment or exact match (no fuzzy for now)
  const matches =
    docNorm === userNorm ||
    docNorm.includes(userNorm) ||
    userNorm.split(/\s+/).every((part) => part.length < 2 || docNorm.includes(part));
  if (matches) return null;
  return {
    code: "OWNER_NAME_MISMATCH",
    severity: "high",
    message: "Owner name on land register extract does not match account name.",
    listingId,
    metadata: { documentOwnerName: documentOwnerName.trim(), userDisplayName: userDisplayName ?? "" },
  };
}

/**
 * Flag users with many listings (possible commercial / abuse).
 */
export async function flagMultipleListingsFromUser(
  userId: string,
  threshold: number = 10
): Promise<FraudFlag | null> {
  const count = await prisma.shortTermListing.count({
    where: { ownerId: userId, listingVerificationStatus: { not: "REJECTED" } },
  });
  if (count < threshold) return null;
  return {
    code: "MULTIPLE_LISTINGS",
    severity: "medium",
    message: `User has ${count} listings (threshold: ${threshold}).`,
    metadata: { userId, count, threshold },
  };
}

/**
 * Flag when owner name on document does not match verified identity (user name).
 * For owner listings: verified identity name must match document owner_name.
 */
export async function flagOwnerNameVsVerifiedIdentity(
  userId: string,
  documentOwnerName: string | null,
  listingId: string
): Promise<FraudFlag | null> {
  if (!documentOwnerName?.trim()) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });
  return flagOwnerNameMismatch(
    documentOwnerName,
    user?.name ?? null,
    listingId
  );
}

/**
 * Flag when multiple active listings exist for the same property (same cadastre).
 */
export async function flagMultipleListingsSameProperty(
  cadastreNumber: string,
  excludeListingId?: string
): Promise<FraudFlag | null> {
  return flagDuplicateCadastre(cadastreNumber, excludeListingId);
}

/**
 * Flag when property location (lat/long) does not match cadastre/address (e.g. geocoded address far from listing).
 */
export function flagLocationMismatch(
  listingId: string,
  listingLat: number | null,
  listingLon: number | null,
  validatedLat: number,
  validatedLon: number,
  toleranceKm: number = 2
): FraudFlag | null {
  if (listingLat == null || listingLon == null) return null;
  const R = 6371;
  const dLat = ((validatedLat - listingLat) * Math.PI) / 180;
  const dLon = ((validatedLon - listingLon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((listingLat * Math.PI) / 180) * Math.cos((validatedLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  if (km <= toleranceKm) return null;
  return {
    code: "LOCATION_MISMATCH",
    severity: "high",
    message: "Property location does not match cadastre/address.",
    listingId,
    metadata: { distanceKm: Math.round(km * 10) / 10, toleranceKm },
  };
}

/**
 * Run all fraud checks for a listing submission. Returns list of flags (no block by default).
 */
export async function runFraudChecks(params: {
  listingId: string;
  cadastreNumber: string;
  userId: string;
  userDisplayName: string | null;
  documentOwnerName?: string | null;
  excludeListingId?: string;
}): Promise<FraudFlag[]> {
  const flags: FraudFlag[] = [];

  const dup = await flagDuplicateCadastre(params.cadastreNumber, params.excludeListingId ?? params.listingId);
  if (dup) flags.push(dup);

  if (params.documentOwnerName) {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { name: true },
    });
    const nameFlag = flagOwnerNameMismatch(
      params.documentOwnerName,
      user?.name ?? params.userDisplayName ?? null,
      params.listingId
    );
    if (nameFlag) flags.push(nameFlag);
  }

  const multi = await flagMultipleListingsFromUser(params.userId);
  if (multi) flags.push(multi);

  return flags;
}
