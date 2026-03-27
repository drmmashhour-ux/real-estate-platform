import type { StaysSearchFilters } from "@/lib/bnhub/stays-filters";

export function parseStaysFiltersFromBody(raw: unknown): StaysSearchFilters | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const noise = typeof o.noiseLevel === "string" ? o.noiseLevel.toLowerCase() : "";
  const petType = typeof o.petType === "string" ? o.petType.toLowerCase() : "";
  const weight =
    typeof o.guestPetWeightKg === "number"
      ? o.guestPetWeightKg
      : typeof o.guestPetWeightKg === "string"
        ? Number.parseFloat(o.guestPetWeightKg)
        : null;

  const f: StaysSearchFilters = {
    noiseLevel:
      noise === "quiet" || noise === "moderate" || noise === "lively" ? (noise as "quiet" | "moderate" | "lively") : null,
    familyFriendly: o.familyFriendly === true,
    partyFriendly: o.partyFriendly === true,
    petsOnly: o.petsOnly === true,
    petType: petType === "dog" || petType === "cat" || petType === "other" ? petType : null,
    guestPetWeightKg: weight != null && Number.isFinite(weight) && weight > 0 ? weight : null,
    expWaterfront: o.expWaterfront === true,
    expDowntown: o.expDowntown === true,
    expAttractions: o.expAttractions === true,
    svcAirportPickup: o.svcAirportPickup === true,
    svcParking: o.svcParking === true,
    svcShuttle: o.svcShuttle === true,
  };
  return f;
}
