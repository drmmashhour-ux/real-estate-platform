/**
 * Rule-based segments — inspectable booleans, no ML black box.
 */
import type { GuestBehaviorProfile, RetentionSegment } from "./types";

const MS_DAY = 86_400_000;

/** Days without activity before we treat a guest as inactive (configurable). */
export function inactiveThresholdDays(): number {
  const raw = process.env.RETENTION_INACTIVE_DAYS?.trim();
  const n = raw ? Number(raw) : 45;
  return Number.isFinite(n) && n >= 7 ? n : 45;
}

/** “New” if account is young and no completed stay yet. */
export function newUserMaxDays(): number {
  const raw = process.env.RETENTION_NEW_USER_DAYS?.trim();
  const n = raw ? Number(raw) : 21;
  return Number.isFinite(n) && n >= 1 ? n : 21;
}

export function resolveRetentionSegment(profile: GuestBehaviorProfile): RetentionSegment {
  const now = Date.now();
  const accountAgeDays = (now - profile.accountCreatedAt.getTime()) / MS_DAY;
  const inactiveAfter = inactiveThresholdDays();
  const lastAct = profile.lastActivityAt?.getTime() ?? 0;
  const daysSinceActivity = lastAct ? (now - lastAct) / MS_DAY : inactiveAfter + 1;

  if (accountAgeDays <= newUserMaxDays() && profile.completedBookings === 0) {
    return "new_user";
  }

  if (daysSinceActivity >= inactiveAfter) {
    return "inactive_user";
  }

  if (profile.completedBookings >= 2) {
    return "returning_user";
  }

  const engagement =
    profile.searchEvents30d +
    profile.clientSearchEvents30d +
    profile.behaviorEngagement30d +
    profile.savesTotal;

  if (engagement >= 3 || profile.savesTotal > 0 || profile.completedBookings === 1) {
    return "active_user";
  }

  return "inactive_user";
}

export function segmentDescription(segment: RetentionSegment): string {
  switch (segment) {
    case "new_user":
      return "Recently joined; no completed stay yet — light onboarding nudges only.";
    case "active_user":
      return "Recent searches, views, or saves — good candidates for relevant stay ideas.";
    case "returning_user":
      return "Multiple completed stays — prioritize destinations they already enjoyed.";
    case "inactive_user":
      return "Quiet for a while — only re-engage within rate limits and explicit opt-in.";
    default:
      return "";
  }
}
