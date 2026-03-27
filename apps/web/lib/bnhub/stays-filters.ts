import type { ShortTermListing } from "@prisma/client";

export function hasActiveStaysFilters(f: StaysSearchFilters | null | undefined): boolean {
  if (!f) return false;
  return Boolean(
    f.noiseLevel ||
    f.familyFriendly ||
    f.partyFriendly ||
    f.petsOnly ||
    f.petType ||
    (f.guestPetWeightKg != null && f.guestPetWeightKg > 0) ||
    f.expWaterfront ||
    f.expDowntown ||
    f.expAttractions ||
    f.svcAirportPickup ||
    f.svcParking ||
    f.svcShuttle
  );
}

export type StaysSearchFilters = {
  noiseLevel?: "quiet" | "moderate" | "lively" | null;
  familyFriendly?: boolean;
  partyFriendly?: boolean;
  petsOnly?: boolean;
  petType?: "dog" | "cat" | "other" | null;
  guestPetWeightKg?: number | null;
  expWaterfront?: boolean;
  expDowntown?: boolean;
  expAttractions?: boolean;
  svcAirportPickup?: boolean;
  svcParking?: boolean;
  svcShuttle?: boolean;
};

function jsonStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string").map((s) => s.toLowerCase());
}

/**
 * Client-side filter on search results (after Prisma query).
 */
export function applyStaysFilters<T extends ShortTermListing>(listings: T[], f: StaysSearchFilters | undefined | null): T[] {
  if (!f) return listings;
  return listings.filter((l) => {
    if (f.noiseLevel && (l.noiseLevel ?? "").toLowerCase() !== f.noiseLevel) return false;
    if (f.familyFriendly && !l.familyFriendly) return false;
    if (f.partyFriendly && !l.partyAllowed) return false;
    if (f.petsOnly && !l.petsAllowed) return false;

    const allowedTypes = jsonStringArray(l.allowedPetTypes);
    if (f.petType && l.petsAllowed) {
      const pt = f.petType.toLowerCase();
      if (!allowedTypes.includes(pt) && !allowedTypes.includes("other")) return false;
    }
    if (f.guestPetWeightKg != null && l.maxPetWeightKg != null && f.guestPetWeightKg > l.maxPetWeightKg) {
      return false;
    }

    const exp = jsonStringArray(l.experienceTags);
    if (f.expWaterfront && !exp.includes("waterfront")) return false;
    if (f.expDowntown && !exp.includes("downtown")) return false;
    if (f.expAttractions && !exp.includes("near_attractions")) return false;

    const svc = jsonStringArray(l.servicesOffered);
    if (f.svcAirportPickup && !svc.includes("airport_pickup")) return false;
    if (f.svcParking && !svc.includes("parking")) return false;
    if (f.svcShuttle && !svc.includes("shuttle")) return false;

    return true;
  });
}
