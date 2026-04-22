import { prisma } from "@/lib/db";

/** Scale metrics for 1k → 10k user growth narrative (aggregates stored events + leads). */
export async function getGrowthScaleDashboardSnapshot() {
  const since30d = new Date();
  since30d.setDate(since30d.getDate() - 30);

  const [
    visits,
    signups,
    activations,
    conversions,
    leads,
    usersRecent,
    referralRows,
    acceptedInvites,
  ] = await Promise.all([
    prisma.lecipmGrowthFunnelEvent.count({ where: { category: "VISIT", createdAt: { gte: since30d } } }),
    prisma.lecipmGrowthFunnelEvent.count({ where: { category: "SIGNUP", createdAt: { gte: since30d } } }),
    prisma.lecipmGrowthFunnelEvent.count({ where: { category: "ACTIVATION", createdAt: { gte: since30d } } }),
    prisma.lecipmGrowthFunnelEvent.count({ where: { category: "CONVERSION", createdAt: { gte: since30d } } }),
    prisma.lecipmGrowthCaptureLead.count({ where: { createdAt: { gte: since30d } } }),
    prisma.user.count({ where: { createdAt: { gte: since30d } } }),
    prisma.lecipmBrokerLaunchReferral.groupBy({
      by: ["referrerUserId"],
      _count: { id: true },
    }),
    prisma.lecipmBrokerInvite.count({ where: { status: "ACCEPTED" } }),
  ]);

  const referrersWithOutreach = referralRows.length;
  const totalReferrals = referralRows.reduce((s, r) => s + r._count.id, 0);
  /** Simplified viral proxy: referrals per active referrer (not a true K-factor). */
  const viralCoefficientApprox =
    referrersWithOutreach > 0 ? Math.round((totalReferrals / referrersWithOutreach) * 100) / 100 : 0;

  const visitToLead = visits > 0 ? Math.round((leads / visits) * 1000) / 1000 : 0;
  const leadToSignupApprox = leads > 0 ? Math.round((signups / leads) * 1000) / 1000 : 0;

  return {
    window: "30d",
    traffic: { visits },
    funnel: {
      signups,
      activations,
      conversions,
      captureLeads: leads,
      newPlatformUsers: usersRecent,
    },
    conversionRates: {
      visitToLeadRatio: visitToLead,
      leadToSignupApprox,
    },
    referrals: {
      acceptedBrokerInvites: acceptedInvites,
      launchReferralRows: totalReferrals,
      activeReferrers: referrersWithOutreach,
      viralCoefficientApprox,
    },
    narrative:
      "Figures combine funnel events, capture leads, signups, and referral graph — tune via growth SEO + capture APIs.",
  };
}
