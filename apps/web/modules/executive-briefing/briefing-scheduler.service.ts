/**
 * Weekly cadence helper — actual scheduling is external (cron / worker).
 * Returns next suggested UTC instant for alignment (Monday 06:00 UTC default).
 */
export function getSuggestedNextWeeklyBriefingRunUtc(from: Date = new Date()): Date {
  const d = new Date(from.getTime());
  const day = d.getUTCDay();
  const daysUntilMonday = (8 - day) % 7 || 7;
  d.setUTCDate(d.getUTCDate() + daysUntilMonday);
  d.setUTCHours(6, 0, 0, 0);
  if (d <= from) {
    d.setUTCDate(d.getUTCDate() + 7);
  }
  return d;
}
