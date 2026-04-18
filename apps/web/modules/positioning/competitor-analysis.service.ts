export type CompetitorId = "airbnb" | "centris" | "generic_mls";

export type CompetitorProfile = {
  id: CompetitorId;
  name: string;
  /** Qualitative — not market share numbers. */
  typicalConstraints: string[];
};

const PROFILES: Record<CompetitorId, CompetitorProfile> = {
  airbnb: {
    id: "airbnb",
    name: "Airbnb",
    typicalConstraints: [
      "Guest ↔ host relationship is arms-length; brokerage workflows live elsewhere.",
      "STR compliance is fragmented by host; broker-grade deal rooms are out of scope.",
    ],
  },
  centris: {
    id: "centris",
    name: "Centris / MLS portals",
    typicalConstraints: [
      "Listing distribution, not end-to-end Québec broker execution + trust tooling.",
      "Limited BNHub-style hospitality + payments in one consumer journey.",
    ],
  },
  generic_mls: {
    id: "generic_mls",
    name: "Generic MLS IDX",
    typicalConstraints: [
      "Search and display, not OACIQ-aligned deal coordination + AI drafting under review.",
    ],
  },
};

export function listCompetitorProfiles(): CompetitorProfile[] {
  return [PROFILES.airbnb, PROFILES.centris, PROFILES.generic_mls];
}
