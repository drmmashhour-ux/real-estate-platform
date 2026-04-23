function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function computeZoneActivityScore(input: {
  listingsCount: number;
  soldCount: number;
  reservationsCount: number;
  dealCount: number;
  visitorsCount: number;
}) {
  const score = clamp(
    input.listingsCount * 1.2 +
      input.soldCount * 2 +
      input.reservationsCount * 1.5 +
      input.dealCount * 1.7 +
      input.visitorsCount * 0.05,
  );

  let activityLabel = "quiet";
  if (score >= 80) activityLabel = "hot";
  else if (score >= 55) activityLabel = "active";
  else if (score >= 30) activityLabel = "moderate";

  return {
    activityScore: score,
    activityLabel,
  };
}

export const CITY_ZONE_DATA_SCOPE_NOTE =
  "Platform activity data · Estimated zone score · Not a full-market census";

export const CITY_ZONE_UI_LABELS = [
  "Platform activity data",
  "Imported market data (when shown separately)",
  "Estimated zone score — advisory only",
] as const;
