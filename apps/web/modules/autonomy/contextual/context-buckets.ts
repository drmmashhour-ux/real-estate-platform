export function bucketOccupancy(value: number) {
  if (value < 0.35) return "very_low";
  if (value < 0.5) return "low";
  if (value < 0.7) return "medium";
  if (value < 0.85) return "high";
  return "very_high";
}

export function bucketAdr(value: number) {
  if (value < 100) return "budget";
  if (value < 180) return "mid";
  if (value < 300) return "premium";
  return "luxury";
}

export function bucketRevpar(value: number) {
  if (value < 60) return "low";
  if (value < 120) return "medium";
  if (value < 220) return "high";
  return "very_high";
}

export function bucketBookings(value: number) {
  if (value <= 2) return "very_low";
  if (value <= 6) return "low";
  if (value <= 12) return "medium";
  return "high";
}

export function bucketTrend(value: number) {
  if (value < -0.15) return "strong_down";
  if (value < -0.05) return "down";
  if (value <= 0.05) return "flat";
  if (value <= 0.15) return "up";
  return "strong_up";
}

export function bucketWeekendBias(value: number) {
  if (value < 0.3) return "weekday_heavy";
  if (value < 0.6) return "balanced";
  return "weekend_heavy";
}

export function bucketSeason(date: Date) {
  const month = date.getUTCMonth() + 1;
  if ([12, 1, 2].includes(month)) return "winter";
  if ([3, 4, 5].includes(month)) return "spring";
  if ([6, 7, 8].includes(month)) return "summer";
  return "fall";
}

export function bucketPriceTier(adr: number) {
  if (adr < 120) return "low";
  if (adr < 220) return "mid";
  return "high";
}
