export function computeComparableDifferences(input: {
  subject: Record<string, unknown>;
  comparable: Record<string, unknown>;
}) {
  const s = input.subject ?? {};
  const c = input.comparable ?? {};

  return {
    areaDiffSqft:
      typeof s.buildingAreaSqft === "number" && typeof c.buildingAreaSqft === "number"
        ? s.buildingAreaSqft - c.buildingAreaSqft
        : null,

    lotAreaDiffSqft:
      typeof s.lotAreaSqft === "number" && typeof c.lotAreaSqft === "number"
        ? s.lotAreaSqft - c.lotAreaSqft
        : null,

    bedroomDiff:
      typeof s.bedrooms === "number" && typeof c.bedrooms === "number" ? s.bedrooms - c.bedrooms : null,

    bathroomDiff:
      typeof s.bathrooms === "number" && typeof c.bathrooms === "number" ? s.bathrooms - c.bathrooms : null,

    yearBuiltDiff:
      typeof s.yearBuilt === "number" && typeof c.yearBuilt === "number" ? s.yearBuilt - c.yearBuilt : null,

    frontageDiff:
      typeof s.frontage === "number" && typeof c.frontage === "number" ? s.frontage - c.frontage : null,

    depthDiff: typeof s.depth === "number" && typeof c.depth === "number" ? s.depth - c.depth : null,

    sameShape: s.shape && c.shape ? s.shape === c.shape : null,

    cornerLotDiff:
      typeof s.cornerLot === "boolean" && typeof c.cornerLot === "boolean"
        ? Number(s.cornerLot) - Number(c.cornerLot)
        : null,

    conditionDiff:
      typeof s.conditionRating === "number" && typeof c.conditionRating === "number"
        ? s.conditionRating - c.conditionRating
        : null,

    locationDiff:
      typeof s.locationRating === "number" && typeof c.locationRating === "number"
        ? s.locationRating - c.locationRating
        : null,

    utilityDiff: s.utilities && c.utilities ? s.utilities !== c.utilities : null,
  };
}
