/**
 * Return likelihood heuristic (0–100). Transparent weights; not a guarantee of booking.
 */
import type { GuestBehaviorProfile } from "./types";
import type { ReturnScoreResult } from "./types";

const MS_DAY = 86_400_000;

export function computeReturnScore(profile: GuestBehaviorProfile): ReturnScoreResult {
  const factors: ReturnScoreResult["factors"] = [];

  const recencyDays = profile.lastActivityAt
    ? (Date.now() - profile.lastActivityAt.getTime()) / MS_DAY
    : 120;
  const recencyScore = Math.max(0, Math.min(35, 35 - recencyDays * 0.8));
  factors.push({
    label: "Recency",
    value: Math.round(recencyScore),
    note: `Last activity ~${recencyDays.toFixed(0)}d ago (fades as idle time grows).`,
  });

  const bookingPts = Math.min(30, profile.completedBookings * 12);
  factors.push({
    label: "Completed stays",
    value: Math.round(bookingPts),
    note: `${profile.completedBookings} completed stay(s) on record.`,
  });

  const engagementPts = Math.min(
    20,
    Math.round(
      (profile.searchEvents30d + profile.clientSearchEvents30d) * 0.8 +
        profile.behaviorEngagement30d * 0.3 +
        profile.distinctListingViews30d * 0.5
    )
  );
  factors.push({
    label: "Recent exploration",
    value: engagementPts,
    note: "Searches and listing engagement in the last 30 days.",
  });

  const savePts = Math.min(15, profile.savesTotal * 3);
  factors.push({
    label: "Saved listings",
    value: Math.round(savePts),
    note: `${profile.savesTotal} saved listing(s).`,
  });

  const score = Math.round(
    Math.min(100, factors.reduce((s, f) => s + f.value, 0))
  );

  return { score, factors };
}
