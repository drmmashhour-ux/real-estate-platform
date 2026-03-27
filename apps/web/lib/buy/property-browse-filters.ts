import type { FsboListing } from "@prisma/client";

/** Same semantics as BNHub stays filters — applied to FSBO rows (Buy / long-term rent). */
export type PropertyBrowseFilters = {
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

export function hasActivePropertyBrowseFilters(f: PropertyBrowseFilters | null | undefined): boolean {
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

function jsonStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string").map((s) => s.toLowerCase());
}

type FsboLifestyleRow = Pick<
  FsboListing,
  | "noiseLevel"
  | "familyFriendly"
  | "kidsAllowed"
  | "partyAllowed"
  | "smokingAllowed"
  | "petsAllowed"
  | "allowedPetTypes"
  | "maxPetWeightKg"
  | "experienceTags"
  | "servicesOffered"
>;

export function applyFsboPropertyFilters<T extends FsboLifestyleRow>(listings: T[], f: PropertyBrowseFilters | undefined | null): T[] {
  if (!f || !hasActivePropertyBrowseFilters(f)) return listings;
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

export function parsePropertyBrowseFiltersFromBody(raw: unknown): PropertyBrowseFilters {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const p = o.propertyFilters && typeof o.propertyFilters === "object" ? (o.propertyFilters as Record<string, unknown>) : {};
  const noise = typeof p.noiseLevel === "string" ? p.noiseLevel.toLowerCase() : "";
  const petType = typeof p.petType === "string" ? p.petType.toLowerCase() : "";
  const weightRaw = p.guestPetWeightKg;
  const weightNum =
    typeof weightRaw === "number"
      ? weightRaw
      : typeof weightRaw === "string" && weightRaw.trim()
        ? Number.parseFloat(weightRaw)
        : null;

  return {
    noiseLevel: noise === "quiet" || noise === "moderate" || noise === "lively" ? noise : null,
    familyFriendly: p.familyFriendly === true,
    partyFriendly: p.partyFriendly === true,
    petsOnly: p.petsOnly === true,
    petType: petType === "dog" || petType === "cat" || petType === "other" ? petType : null,
    guestPetWeightKg: weightNum != null && Number.isFinite(weightNum) ? weightNum : null,
    expWaterfront: p.expWaterfront === true,
    expDowntown: p.expDowntown === true,
    expAttractions: p.expAttractions === true,
    svcAirportPickup: p.svcAirportPickup === true,
    svcParking: p.svcParking === true,
    svcShuttle: p.svcShuttle === true,
  };
}
