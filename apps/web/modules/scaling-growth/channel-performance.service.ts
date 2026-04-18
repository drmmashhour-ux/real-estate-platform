import { getAcquisitionSignupInsights } from "@/lib/admin/acquisition-signup-insights";
import { prisma } from "@/lib/db";
import { subDays } from "date-fns";

export type ChannelPerformanceRow = {
  channel: string;
  signups90d: number;
  verified90d: number;
  verificationRate: number | null;
};

export type ReferralPulse = {
  referrals90d: number;
  referralsAllTime: number;
};

/**
 * Signup channel mix + referral volume — real DB counts only.
 */
export async function buildChannelPerformance(windowDays = 90): Promise<{
  generatedAt: string;
  windowDays: number;
  channels: ChannelPerformanceRow[];
  referrals: ReferralPulse;
  bestChannelBySignups: string | null;
  disclaimers: string[];
}> {
  const insights = await getAcquisitionSignupInsights(windowDays);
  const since = subDays(new Date(), windowDays);

  const referrals90d = await prisma.referral.count({ where: { createdAt: { gte: since } } });
  const referralsAllTime = await prisma.referral.count();

  const channels: ChannelPerformanceRow[] = insights.byChannel.map((c) => ({
    channel: c.channel,
    signups90d: c.signups,
    verified90d: c.verified,
    verificationRate: c.signups === 0 ? null : c.verified / c.signups,
  }));

  const sorted = [...channels].sort((a, b) => b.signups90d - a.signups90d);
  const best = sorted[0];

  return {
    generatedAt: new Date().toISOString(),
    windowDays,
    channels,
    referrals: { referrals90d, referralsAllTime },
    bestChannelBySignups: best && best.signups90d > 0 ? best.channel : null,
    disclaimers: [
      "Channels derive from `User.signupAttributionJson` at registration — completeness depends on cookie/UTM capture.",
    ],
  };
}
