export function computePromotionWindowEnd(startAt: Date, billingPeriod: string): Date {
  const end = new Date(startAt.getTime());
  const p = billingPeriod.toLowerCase();
  if (p === "weekly" || p === "week") {
    end.setUTCDate(end.getUTCDate() + 7);
  } else {
    end.setUTCDate(end.getUTCDate() + 30);
  }
  return end;
}
