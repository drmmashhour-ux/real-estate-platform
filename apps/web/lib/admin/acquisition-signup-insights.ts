import { prisma } from "@/lib/db";
import type { AcquisitionChannel, SignupAttributionPayload } from "@/lib/attribution/signup-attribution";

export type DailySignupCount = { day: string; count: number; verified: number };

export type ChannelBreakdown = { channel: AcquisitionChannel | "unknown"; signups: number; verified: number };

export type AcquisitionSignupInsights = {
  days: number;
  totalSignups: number;
  verifiedSignups: number;
  verificationRate: number;
  byDay: DailySignupCount[];
  byChannel: ChannelBreakdown[];
};

function channelFromJson(raw: unknown): AcquisitionChannel | "unknown" {
  if (raw == null) return "unknown";
  if (typeof raw === "object" && raw !== null && "channel" in raw) {
    const c = (raw as SignupAttributionPayload).channel;
    if (
      c === "tiktok" ||
      c === "instagram" ||
      c === "facebook" ||
      c === "outreach" ||
      c === "direct" ||
      c === "organic" ||
      c === "other"
    ) {
      return c;
    }
  }
  return "unknown";
}

function dayKeyUtc(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Rollups for admin: signups per day, by acquisition channel, email verification rate. */
export async function getAcquisitionSignupInsights(days = 30): Promise<AcquisitionSignupInsights> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);
  since.setUTCHours(0, 0, 0, 0);

  const users = await prisma.user.findMany({
    where: { createdAt: { gte: since } },
    select: {
      createdAt: true,
      emailVerifiedAt: true,
      signupAttributionJson: true,
    },
  });

  const totalSignups = users.length;
  const verifiedSignups = users.filter((u) => u.emailVerifiedAt != null).length;
  const verificationRate = totalSignups === 0 ? 0 : verifiedSignups / totalSignups;

  const dayMap = new Map<string, { count: number; verified: number }>();
  const chanMap = new Map<AcquisitionChannel | "unknown", { signups: number; verified: number }>();

  for (const u of users) {
    const k = dayKeyUtc(u.createdAt);
    const cur = dayMap.get(k) ?? { count: 0, verified: 0 };
    cur.count += 1;
    if (u.emailVerifiedAt) cur.verified += 1;
    dayMap.set(k, cur);

    const ch = channelFromJson(u.signupAttributionJson);
    const cc = chanMap.get(ch) ?? { signups: 0, verified: 0 };
    cc.signups += 1;
    if (u.emailVerifiedAt) cc.verified += 1;
    chanMap.set(ch, cc);
  }

  const byDay: DailySignupCount[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setUTCDate(d.getUTCDate() + i);
    const key = dayKeyUtc(d);
    const row = dayMap.get(key) ?? { count: 0, verified: 0 };
    byDay.push({ day: key, count: row.count, verified: row.verified });
  }

  const order: (AcquisitionChannel | "unknown")[] = [
    "tiktok",
    "instagram",
    "facebook",
    "outreach",
    "organic",
    "direct",
    "other",
    "unknown",
  ];
  const byChannel: ChannelBreakdown[] = order
    .filter((c) => chanMap.has(c))
    .map((channel) => {
      const r = chanMap.get(channel)!;
      return { channel, signups: r.signups, verified: r.verified };
    });

  return {
    days,
    totalSignups,
    verifiedSignups,
    verificationRate,
    byDay,
    byChannel,
  };
}
