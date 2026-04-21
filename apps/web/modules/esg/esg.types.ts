export type EsgGrade = "A" | "B" | "C";

export type EsgScoreEngineResult = {
  score: number;
  grade: EsgGrade;
  flags: string[];
};

export type EsgProfilePayload = {
  energyScore: number | null;
  carbonScore: number | null;
  sustainabilityScore: number | null;
  certification: string | null;
  solar: boolean;
  renovation: boolean;
  highCarbonMaterials: boolean;
};

/** Public-safe badge payload for listing UI (composite ≥ threshold). */
export type EsgBadgePayload = {
  grade: EsgGrade;
  score: number;
  label: string;
};
