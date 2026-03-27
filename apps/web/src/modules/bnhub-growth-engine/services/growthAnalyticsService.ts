import { prisma } from "@/lib/db";

export async function growthGlobalOverview() {
  const [activeCampaigns, leadsWeek, hotLeads, distributions] = await Promise.all([
    prisma.bnhubGrowthCampaign.count({ where: { status: "ACTIVE" } }),
    prisma.bnhubLead.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
    }),
    prisma.bnhubLead.count({ where: { leadTemperature: "HOT", status: { not: "SPAM" } } }),
    prisma.bnhubGrowthDistribution.findMany({
      where: { distributionStatus: "PUBLISHED" },
      include: { connector: true },
      take: 200,
    }),
  ]);

  const byConnector = new Map<string, { impressions: number; clicks: number; leads: number; spend: number }>();
  for (const d of distributions) {
    const code = d.connector.connectorCode;
    const cur = byConnector.get(code) ?? { impressions: 0, clicks: 0, leads: 0, spend: 0 };
    cur.impressions += d.impressions;
    cur.clicks += d.clicks;
    cur.leads += d.leads;
    cur.spend += d.spendCents;
    byConnector.set(code, cur);
  }

  const connectors = await prisma.bnhubGrowthConnector.findMany({ orderBy: { connectorCode: "asc" } });

  return {
    activeCampaigns,
    leadsThisWeek: leadsWeek,
    hotLeads,
    channelMix: [...byConnector.entries()].map(([code, v]) => ({
      code,
      ...v,
      ctr: v.impressions > 0 ? v.clicks / v.impressions : 0,
    })),
    connectorHealth: connectors.map((c) => ({
      code: c.connectorCode,
      name: c.name,
      status: c.status,
      lastHealthcheckAt: c.lastHealthcheckAt,
    })),
    labels: {
      mix: "Mix of internal measured + connector-synced + estimates where noted",
    },
  };
}
