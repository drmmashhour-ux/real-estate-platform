/**
 * Triple verification (4): Geo-location validation.
 * Verify property location matches cadastre address: geocode address, confirm coordinates match listing, municipality matches.
 */

import { prisma } from "@/lib/db";
import type { VerificationStatus } from "@prisma/client";

const GEO_TOLERANCE_KM = 1; // Allow ~1km tolerance
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export type GeocodeResult = { latitude: number; longitude: number; address: string } | null;

/**
 * Geocode an address. Default: use listing lat/long if present; otherwise return null (caller can use external geocoder).
 */
export async function geocodeAddress(
  address: string,
  municipality: string | null,
  province: string | null,
  existingLat?: number | null,
  existingLon?: number | null
): Promise<GeocodeResult> {
  if (existingLat != null && existingLon != null) {
    return {
      latitude: existingLat,
      longitude: existingLon,
      address: [address, municipality, province].filter(Boolean).join(", "),
    };
  }
  // Optional: call external geocoding API (e.g. Google Maps, Nominatim)
  // const res = await fetch(...); return { latitude, longitude, address };
  return null;
}

export async function getPropertyLocationValidation(listingId: string) {
  return prisma.propertyLocationValidation.findUnique({
    where: { listingId },
  });
}

export async function upsertPropertyLocationValidation(params: {
  listingId: string;
  latitude: number;
  longitude: number;
  address: string;
  validationStatus?: VerificationStatus;
}) {
  return prisma.propertyLocationValidation.upsert({
    where: { listingId: params.listingId },
    create: {
      listingId: params.listingId,
      latitude: params.latitude,
      longitude: params.longitude,
      address: params.address,
      validationStatus: params.validationStatus ?? "PENDING",
    },
    update: {
      latitude: params.latitude,
      longitude: params.longitude,
      address: params.address,
      ...(params.validationStatus != null && { validationStatus: params.validationStatus }),
    },
  });
}

export async function setLocationValidationDecision(
  listingId: string,
  status: VerificationStatus,
  adminUserId: string,
  notes?: string | null
) {
  return prisma.propertyLocationValidation.update({
    where: { listingId },
    data: {
      validationStatus: status,
      validatedById: adminUserId,
      validatedAt: status === "VERIFIED" ? new Date() : null,
      notes: notes ?? undefined,
    },
  });
}

/**
 * Check if listing coordinates are within tolerance of validated location.
 */
export function coordinatesMatch(
  listingLat: number | null,
  listingLon: number | null,
  validatedLat: number,
  validatedLon: number
): boolean {
  if (listingLat == null || listingLon == null) return false;
  return haversineKm(listingLat, listingLon, validatedLat, validatedLon) <= GEO_TOLERANCE_KM;
}

export async function isLocationValidated(listingId: string): Promise<boolean> {
  const r = await prisma.propertyLocationValidation.findUnique({
    where: { listingId },
    select: { validationStatus: true },
  });
  return r?.validationStatus === "VERIFIED";
}
