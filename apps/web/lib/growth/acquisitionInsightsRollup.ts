import type { SignupAttributionPayload } from "@/lib/attribution/signup-attribution";
import { normalizeAcquisitionSource } from "@/lib/growth/acquisitionSourceNormalize";
import type { Prisma } from "@prisma/client";

export type AcquisitionChannelInsight = {
  source: string;
  users: number;
  percentage: number;
  /** Users in this channel with `launchOnboardingCompletedAt` set (simple “reached onboarding”). */
  onboardedUsers: number;
  /** Users in this channel with at least one confirmed/completed booking as guest (simple “converted”). */
  convertedUsers: number;
  /** `convertedUsers / users` when `users > 0`, else null. */
  conversionRate: number | null;
};

export type AcquisitionInsights = {
  channels: AcquisitionChannelInsight[];
  topChannel: string | null;
  totalUsers: number;
  /** Users with any parsed acquisition source (excludes fully unknown). */
  attributedUsers: number;
  /** Future: first-touch vs last-touch (Order 50.1 optional). */
  notes: string[];
};

function channelFromSignupJson(raw: Prisma.JsonValue | null | undefined): string | null {
  if (raw == null || typeof raw !== "object" || raw === null) return null;
  const o = raw as SignupAttributionPayload & { channel?: string };
  if (typeof o.channel === "string" && o.channel.length > 0) {
    return o.channel;
  }
  return null;
}

type UserAttributionSelect = {
  id: string;
  signupAttributionJson: Prisma.JsonValue | null;
  launchOnboardingCompletedAt: Date | null;
};

/**
 * Pure roll-up: one array element = one **distinct** user (no per-user multi-row inflation).
 * @internal also imported by server module + unit tests
 */
export function buildAcquisitionInsightsFromUserRows(
  users: UserAttributionSelect[],
  convertedSet: Set<string>
): AcquisitionInsights {
  const bySource = new Map<string, { users: number; onboarded: number; converted: number }>();

  let attributed = 0;
  for (const u of users) {
    const rawCh = channelFromSignupJson(u.signupAttributionJson);
    const source = rawCh == null ? "other" : normalizeAcquisitionSource(rawCh);
    if (rawCh != null) attributed += 1;

    const row = bySource.get(source) ?? { users: 0, onboarded: 0, converted: 0 };
    row.users += 1;
    if (u.launchOnboardingCompletedAt != null) row.onboarded += 1;
    if (convertedSet.has(u.id)) row.converted += 1;
    bySource.set(source, row);
  }

  const totalUsers = users.length;
  const channels: AcquisitionChannelInsight[] = [];
  for (const [source, row] of bySource.entries()) {
    const pct = totalUsers === 0 ? 0 : (row.users / totalUsers) * 100;
    channels.push({
      source,
      users: row.users,
      percentage: Math.round(pct * 10) / 10,
      onboardedUsers: row.onboarded,
      convertedUsers: row.converted,
      conversionRate: row.users === 0 ? null : Math.round((row.converted / row.users) * 1000) / 10,
    });
  }

  channels.sort((a, b) => b.users - a.users);
  const topChannel = channels.length > 0 && channels[0]!.users > 0 ? channels[0]!.source : null;

  return {
    channels,
    topChannel,
    totalUsers,
    attributedUsers: attributed,
    notes: [
      "Sources are first-touch from `User.signup_attribution_json` at signup; one user counts once.",
      "Normalize incoming `?src=` / `acquisitionChannel` to: tiktok, meta, google, referral, direct, organic.",
      "Multi-touch events: optional future `Acquisition` table for first vs last touch.",
    ],
  };
}
