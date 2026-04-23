import type { NotificationPreference } from "@prisma/client";

/**
 * Quiet hours as an overnight or same-day window in local server time.
 * Example: start 22, end 7 → quiet from 22:00 inclusive through before 07:00.
 */
export function isQuietHours(pref: Pick<NotificationPreference, "quietHoursStart" | "quietHoursEnd">): boolean {
  if (pref.quietHoursStart == null || pref.quietHoursEnd == null) return false;
  const hour = new Date().getHours();
  const start = pref.quietHoursStart;
  const end = pref.quietHoursEnd;
  if (start === end) return false;
  if (start < end) {
    return hour >= start && hour < end;
  }
  return hour >= start || hour < end;
}
