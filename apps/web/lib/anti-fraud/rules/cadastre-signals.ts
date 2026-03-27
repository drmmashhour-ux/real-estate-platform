/**
 * Cadastre-related fraud signals: duplicate, multiple users, different cities.
 */

import { prisma } from "@/lib/db";
import type { FraudReason } from "../models";

export async function checkDuplicateCadastre(
  listingId: string,
  cadastreNumber: string | null,
  ownerId: string
): Promise<FraudReason | null> {
  if (!cadastreNumber?.trim()) return null;
  const n = cadastreNumber.trim();
  const other = await prisma.shortTermListing.findFirst({
    where: {
      cadastreNumber: n,
      id: { not: listingId },
      listingVerificationStatus: { in: ["PENDING_VERIFICATION", "VERIFIED"] },
    },
    select: { id: true, ownerId: true, city: true },
  });
  if (!other) return null;
  return {
    signal: "duplicate_cadastre",
    points: 40,
    detail: other.ownerId !== ownerId ? "Used by another user" : "Duplicate listing",
  };
}

export async function checkCadastreMultipleUsers(
  listingId: string,
  cadastreNumber: string | null
): Promise<FraudReason | null> {
  if (!cadastreNumber?.trim()) return null;
  const n = cadastreNumber.trim();
  const distinct = await prisma.shortTermListing.groupBy({
    by: ["ownerId"],
    where: {
      cadastreNumber: n,
      id: { not: listingId },
      listingVerificationStatus: { not: "REJECTED" },
    },
  });
  if (distinct.length === 0) return null;
  return { signal: "cadastre_multiple_users", points: 25, detail: `${distinct.length + 1} users` };
}

export async function checkCadastreDifferentCities(
  listingId: string,
  cadastreNumber: string | null,
  listingCity: string
): Promise<FraudReason | null> {
  if (!cadastreNumber?.trim() || !listingCity?.trim()) return null;
  const other = await prisma.shortTermListing.findFirst({
    where: {
      cadastreNumber: cadastreNumber.trim(),
      id: { not: listingId },
      city: { not: listingCity.trim(), mode: "insensitive" },
    },
    select: { city: true },
  });
  if (!other) return null;
  return {
    signal: "cadastre_different_cities",
    points: 20,
    detail: `Same cadastre in ${other.city}`,
  };
}
