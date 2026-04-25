import { prisma } from "@/lib/db";

export interface OutreachMetrics {
  totalLeads: number;
  /** Messages marked as sent = moved past NEW (first touch logged). */
  sentCount: number;
  /** Same as `sentCount` (alias). */
  contactedCount: number;
  respondedCount: number;
  interestedCount: number;
  onboardedCount: number;
  lostCount: number;
  contactToResponseRate: number;
  responseToOnboardRate: number;
  sourceBreakdown: Record<string, number>;
  onboardProgress: number; // Percentage toward 20 brokers goal
  /** Responded+ / sent+ (replies over touched leads). */
  responseRate: number;
  /** Onboarded / sent (conversions from touched leads). */
  conversionRate: number;
  bestPerformingChannel: string | null;
  /** Best among Instagram / LinkedIn / Referral (ignores small-sample noise when possible). */
  bestSourcedChannel: string | null;
  channelPerformance: Record<string, { count: number; responseRate: number; onboarded: number }>;
}

export async function getOutreachMetrics(): Promise<OutreachMetrics> {
  const leads = await prisma.outreachLead.findMany();
  
  const stats = {
    totalLeads: leads.length,
    contactedCount: leads.filter(l => l.status !== "NEW").length,
    respondedCount: leads.filter(l => ["RESPONDED", "INTERESTED", "ONBOARDED"].includes(l.status)).length,
    interestedCount: leads.filter(l => ["INTERESTED", "ONBOARDED"].includes(l.status)).length,
    onboardedCount: leads.filter(l => l.status === "ONBOARDED").length,
    lostCount: leads.filter(l => l.status === "LOST").length,
  };

  const channelStats: Record<string, { count: number; contacted: number; responded: number; onboarded: number }> = {};

  leads.forEach((l) => {
    if (!channelStats[l.source]) {
      channelStats[l.source] = { count: 0, contacted: 0, responded: 0, onboarded: 0 };
    }
    channelStats[l.source].count++;
    if (l.status !== "NEW") channelStats[l.source].contacted++;
    if (["RESPONDED", "INTERESTED", "ONBOARDED"].includes(l.status)) channelStats[l.source].responded++;
    if (l.status === "ONBOARDED") channelStats[l.source].onboarded++;
  });

  const channelPerformance: Record<string, { count: number; responseRate: number; onboarded: number }> = {};
  let bestChannel: string | null = null;
  let maxRate = -1;

  const SOURCED_CHANNELS = new Set(["INSTAGRAM", "LINKEDIN", "REFERRAL", "GOOGLE_MAPS"]);
  let bestSourced: string | null = null;
  let bestSourcedRate = -1;

  Object.entries(channelStats).forEach(([source, data]) => {
    const responseRate = data.contacted > 0 ? (data.responded / data.contacted) * 100 : 0;
    channelPerformance[source] = {
      count: data.count,
      responseRate,
      onboarded: data.onboarded,
    };
    if (responseRate > maxRate) {
      maxRate = responseRate;
      bestChannel = source;
    }
    if (SOURCED_CHANNELS.has(source) && data.contacted > 0 && data.count >= 1) {
      if (responseRate > bestSourcedRate) {
        bestSourcedRate = responseRate;
        bestSourced = source;
      }
    }
  });

  return {
    ...stats,
    sentCount: stats.contactedCount,
    contactToResponseRate:
      stats.contactedCount > 0 ? (stats.respondedCount / stats.contactedCount) * 100 : 0,
    responseToOnboardRate: stats.respondedCount > 0 ? (stats.onboardedCount / stats.respondedCount) * 100 : 0,
    sourceBreakdown: Object.fromEntries(Object.entries(channelStats).map(([k, v]) => [k, v.count])),
    onboardProgress: (stats.onboardedCount / 20) * 100,
    responseRate: stats.contactedCount > 0 ? (stats.respondedCount / stats.contactedCount) * 100 : 0,
    conversionRate: stats.contactedCount > 0 ? (stats.onboardedCount / stats.contactedCount) * 100 : 0,
    bestPerformingChannel: bestChannel,
    bestSourcedChannel: bestSourced,
    channelPerformance,
  };
}
