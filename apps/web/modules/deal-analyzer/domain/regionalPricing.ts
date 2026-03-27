export const RegionalProfileKey = {
  DENSE_URBAN: "dense_urban",
  SUBURBAN: "suburban",
  SPARSE: "sparse",
  GENERIC: "generic",
} as const;
export type RegionalProfileId = (typeof RegionalProfileKey)[keyof typeof RegionalProfileKey];
