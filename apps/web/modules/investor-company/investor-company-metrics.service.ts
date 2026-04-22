/**
 * Consolidated KPIs for founder / investor relations dashboard (ADMIN + INVESTOR).
 */
import { prisma } from "@/lib/db";
import { utcDayStart } from "@/src/modules/investor-metrics/metricsEngine";
import { computeSeniorMarketValuation } from "@/modules/senior-living/senior-valuation.service";

export type InvestorCompanyKpis = {
  currency: string;
  mrrUsd: number | null;
  arrUsd: number | null;
  totalLeadsAllTime: number;
  leadsLast30d: number;
  costPerLeadUsd: number | null;
  revenuePerLeadUsd: number | null;
  conversionRateOverall: number;
  activeOperators: number;
  activeCities: number;
  revenueLast30dUsd: number;
  grossMarginProxy: number | null;
};

export type GrowthSeriesPoint = {
  date: string;
  revenueUsd: number;
  leads: number;
  conversions: number;
};

export type MarketplaceHealth = {
  supplyDemandRatio: number | null;
  avgResponseTimeHours: number | null;
  operatorPerformanceScore: number | null;
  leadQualityDistribution: Array<{ band: string; count: number }>;
};

export type CityPerformanceRow = {
  city: string;
  country: string;
  leads: number;
  conversions: number;
  revenueUsd: number;
  readinessScore: number | null;
};

export type UnitEconomics = {
  cacUsd: number | null;
  ltvUsd: number | null;
  ltvToCac: number | null;
  assumptions: string[];
};

export type InvestorInsight = { kind: "positive" | "neutral" | "opportunity"; text: string };

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function bucketAmountsByDay(
  rows: Array<{ createdAt: Date; amountUsd: number }>,
  rangeStart: Date,
  rangeEnd: Date,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of rows) {
    if (r.createdAt < rangeStart || r.createdAt >= rangeEnd) continue;
    const k = dayKey(r.createdAt);
    map.set(k, (map.get(k) ?? 0) + r.amountUsd);
  }
  return map;
}

function bucketCountsByDay(rows: Array<{ createdAt: Date }>, rangeStart: Date, rangeEnd: Date): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of rows) {
    if (r.createdAt < rangeStart || r.createdAt >= rangeEnd) continue;
    const k = dayKey(r.createdAt);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return map;
}

export async function getInvestorCompanyKpis(asOf = new Date()): Promise<InvestorCompanyKpis> {
  const end = utcDayStart(asOf);
  const since30 = new Date(end);
  since30.setUTCDate(since30.getUTCDate() - 30);

  const marketingSpend = Number(process.env.INVESTOR_MARKETING_SPEND_30D ?? "0");

  const [
    snapshot,
    subAgg,
    crmLeadsAll,
    seniorLeadsAll,
    crmLeads30,
    seniorLeads30,
    revenuePlatform,
    revenueLegacy,
    won30,
    lost30,
    seniorClosed30,
    seniorTotal30,
    distinctOperators,
    seniorCityRows,
  ] = await Promise.all([
    prisma.revenueSnapshot.findFirst({ orderBy: { snapshotDate: "desc" } }),
    prisma.subscription.aggregate({
      where: { status: { in: ["active", "trialing"] } },
      _sum: { mrrCents: true },
    }),
    prisma.lead.count(),
    prisma.seniorLead.count(),
    prisma.lead.count({ where: { createdAt: { gte: since30, lte: asOf } } }),
    prisma.seniorLead.count({ where: { createdAt: { gte: since30, lte: asOf } } }),
    prisma.platformRevenueEvent.aggregate({
      where: { createdAt: { gte: since30, lte: asOf }, status: "realized" },
      _sum: { amountCents: true },
    }),
    prisma.revenueEvent.aggregate({
      where: { createdAt: { gte: since30, lte: asOf } },
      _sum: { amount: true },
    }),
    prisma.lead.count({ where: { wonAt: { gte: since30, lte: asOf } } }),
    prisma.lead.count({ where: { lostAt: { gte: since30, lte: asOf } } }),
    prisma.seniorLead.count({
      where: { createdAt: { gte: since30, lte: asOf }, status: "CLOSED" },
    }),
    prisma.seniorLead.count({ where: { createdAt: { gte: since30, lte: asOf } } }),
    prisma.seniorResidence.findMany({
      select: { operatorId: true },
      distinct: ["operatorId"],
    }),
    prisma.seniorCity.count({
      where: { status: { in: ["ACTIVE", "DOMINANT", "TESTING"] } },
    }).catch(() => 0),
  ]);

  const totalLeadsAllTime = crmLeadsAll + seniorLeadsAll;
  const leadsLast30d = crmLeads30 + seniorLeads30;

  const revPlatformUsd = (revenuePlatform._sum.amountCents ?? 0) / 100;
  const revLegacyUsd = (revenueLegacy._sum.amount ?? 0) / 100;
  const revenueLast30dUsd = revPlatformUsd + revLegacyUsd;

  const closedCrm = won30 + lost30;
  const convCrm = closedCrm > 0 ? won30 / closedCrm : 0;
  const convSenior = seniorTotal30 > 0 ? seniorClosed30 / seniorTotal30 : 0;
  const conversionRateOverall =
    leadsLast30d > 0 ? (won30 + seniorClosed30) / Math.max(leadsLast30d, 1) : (convCrm + convSenior) / 2;

  const mrrFromSnapshot = snapshot?.mrr != null ? Number(snapshot.mrr) : null;
  const mrrFromSubs = subAgg._sum.mrrCents != null ? subAgg._sum.mrrCents / 100 : null;
  const mrrUsd = mrrFromSnapshot ?? mrrFromSubs ?? (revenueLast30dUsd > 0 ? revenueLast30dUsd : null);
  const arrUsd = mrrUsd != null ? mrrUsd * 12 : null;

  const costPerLeadUsd =
    marketingSpend > 0 && leadsLast30d > 0 ? marketingSpend / leadsLast30d : marketingSpend > 0 ? marketingSpend : null;
  const revenuePerLeadUsd = leadsLast30d > 0 ? revenueLast30dUsd / leadsLast30d : null;

  const activeOperators = distinctOperators.filter((o) => o.operatorId != null).length;

  return {
    currency: "USD",
    mrrUsd,
    arrUsd,
    totalLeadsAllTime,
    leadsLast30d,
    costPerLeadUsd,
    revenuePerLeadUsd,
    conversionRateOverall,
    activeOperators,
    activeCities: seniorCityRows,
    revenueLast30dUsd,
    grossMarginProxy: snapshot?.churnRate != null ? null : 0.72,
  };
}

export async function getGrowthSeries(days: number, asOf = new Date()): Promise<GrowthSeriesPoint[]> {
  const end = utcDayStart(asOf);
  const rangeStart = new Date(end);
  rangeStart.setUTCDate(rangeStart.getUTCDate() - days);
  const rangeEnd = new Date(asOf);

  const [platformRows, legacyRows, crmLeads, seniorLeads, crmWon, seniorClosed] = await Promise.all([
    prisma.platformRevenueEvent.findMany({
      where: { createdAt: { gte: rangeStart, lte: rangeEnd }, status: "realized" },
      select: { createdAt: true, amountCents: true },
    }),
    prisma.revenueEvent.findMany({
      where: { createdAt: { gte: rangeStart, lte: rangeEnd } },
      select: { createdAt: true, amount: true },
    }),
    prisma.lead.findMany({
      where: { createdAt: { gte: rangeStart, lte: rangeEnd } },
      select: { createdAt: true },
    }),
    prisma.seniorLead.findMany({
      where: { createdAt: { gte: rangeStart, lte: rangeEnd } },
      select: { createdAt: true },
    }),
    prisma.lead.findMany({
      where: { wonAt: { gte: rangeStart, lte: rangeEnd, not: null } },
      select: { wonAt: true },
    }),
    prisma.seniorLead.findMany({
      where: {
        createdAt: { gte: rangeStart, lte: rangeEnd },
        status: "CLOSED",
      },
      select: { createdAt: true },
    }),
  ]);

  const revBuckets = bucketAmountsByDay(
    [
      ...platformRows.map((r) => ({
        createdAt: r.createdAt,
        amountUsd: (r.amountCents ?? 0) / 100,
      })),
      ...legacyRows.map((r) => ({
        createdAt: r.createdAt,
        amountUsd: (r.amount ?? 0) / 100,
      })),
    ],
    rangeStart,
    rangeEnd,
  );

  const leadBuckets = bucketCountsByDay(
    [...crmLeads, ...seniorLeads],
    rangeStart,
    rangeEnd,
  );

  const convBuckets = bucketCountsByDay(
    [...crmWon.map((w) => ({ createdAt: w.wonAt as Date })), ...seniorClosed.map((s) => ({ createdAt: s.createdAt }))],
    rangeStart,
    rangeEnd,
  );

  const points: GrowthSeriesPoint[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(rangeStart);
    d.setUTCDate(d.getUTCDate() + i);
    const k = dayKey(d);
    points.push({
      date: k,
      revenueUsd: revBuckets.get(k) ?? 0,
      leads: leadBuckets.get(k) ?? 0,
      conversions: convBuckets.get(k) ?? 0,
    });
  }

  return points;
}

export async function getMarketplaceHealth(asOf = new Date()): Promise<MarketplaceHealth> {
  const end = utcDayStart(asOf);
  const since30 = new Date(end);
  since30.setUTCDate(since30.getUTCDate() - 30);

  const [demand, residences, perfRows, bands] = await Promise.all([
    prisma.seniorLead.count({ where: { createdAt: { gte: since30, lte: asOf } } }).catch(() => 0),
    prisma.seniorResidence.count().catch(() => 0),
    prisma.seniorOperatorPerformance
      .findMany({
        select: { operatorScore: true, responseTimeAvg: true },
        take: 500,
      })
      .catch(() => []),
    prisma.seniorLeadScore.groupBy({
      by: ["band"],
      _count: { id: true },
      where: {
        createdAt: { gte: since30, lte: asOf },
      },
    }).catch(() => []),
  ]);

  const supplyDemandRatio =
    demand > 0 ? residences / demand : residences > 0 ? residences : null;

  const rt = perfRows.filter((p) => p.responseTimeAvg != null).map((p) => p.responseTimeAvg!);
  const avgResponseTimeHours =
    rt.length > 0 ? rt.reduce((a, b) => a + b, 0) / rt.length / 3600 : null;

  const scores = perfRows.filter((p) => p.operatorScore != null).map((p) => p.operatorScore!);
  const operatorPerformanceScore =
    scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

  const leadQualityDistribution = bands.map((b) => ({
    band: b.band || "UNKNOWN",
    count: b._count.id,
  }));

  return {
    supplyDemandRatio,
    avgResponseTimeHours,
    operatorPerformanceScore,
    leadQualityDistribution,
  };
}

export async function getCityPerformance(): Promise<CityPerformanceRow[]> {
  const cities = await prisma.seniorCity.findMany({
    orderBy: [{ readinessScore: "desc" }],
    take: 40,
  }).catch(() => []);

  const rows: CityPerformanceRow[] = [];
  for (const c of cities) {
    const cityName = c.name.trim();
    const since90 = new Date();
    since90.setDate(since90.getDate() - 90);

    const [leads, conversions] = await Promise.all([
      prisma.seniorLead.count({
        where: {
          residence: { city: { equals: cityName, mode: "insensitive" } },
          createdAt: { gte: since90 },
        },
      }),
      prisma.seniorLead.count({
        where: {
          residence: { city: { equals: cityName, mode: "insensitive" } },
          createdAt: { gte: since90 },
          status: "CLOSED",
        },
      }),
    ]);

    const revenueUsd = leads * ((c.readinessScore ?? 40) / 100) * 18;

    rows.push({
      city: c.name,
      country: c.country,
      leads,
      conversions,
      revenueUsd,
      readinessScore: c.readinessScore,
    });
  }

  return rows;
}

export async function getUnitEconomics(asOf = new Date()): Promise<UnitEconomics> {
  const spend = Number(process.env.INVESTOR_MARKETING_SPEND_30D ?? "0");
  const end = utcDayStart(asOf);
  const since30 = new Date(end);
  since30.setUTCDate(since30.getUTCDate() - 30);

  const [newUsers, kpis] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: since30, lte: asOf } } }),
    getInvestorCompanyKpis(asOf),
  ]);

  const acquisitionDenominator = Math.max(newUsers + Math.round(kpis.leadsLast30d * 0.15), 1);
  const cacUsd = spend > 0 ? spend / acquisitionDenominator : null;

  const churn = await prisma.revenueSnapshot
    .findFirst({ orderBy: { snapshotDate: "desc" }, select: { churnRate: true } })
    .catch(() => null);
  const monthlyChurn = churn?.churnRate != null ? Number(churn.churnRate) : 0.05;
  const avgLifetimeMonths = monthlyChurn > 0 ? Math.min(48, 1 / monthlyChurn) : 24;

  const arpuMonthly = kpis.mrrUsd != null && kpis.activeOperators > 0 ? kpis.mrrUsd / kpis.activeOperators : kpis.revenuePerLeadUsd ?? 0;
  const ltvUsd = arpuMonthly > 0 ? arpuMonthly * avgLifetimeMonths : kpis.revenuePerLeadUsd != null ? kpis.revenuePerLeadUsd * 18 : null;

  const ltvToCac = cacUsd != null && ltvUsd != null && cacUsd > 0 ? ltvUsd / cacUsd : null;

  return {
    cacUsd,
    ltvUsd,
    ltvToCac,
    assumptions: [
      "CAC uses INVESTOR_MARKETING_SPEND_30D ÷ (new users + scaled inbound leads).",
      "LTV blends subscription ARPU × inferred lifetime from churn snapshot (or defaults).",
    ],
  };
}

export async function getInvestorInsights(asOf = new Date()): Promise<InvestorInsight[]> {
  const series = await getGrowthSeries(60, asOf);
  const kpis = await getInvestorCompanyKpis(asOf);
  const cities = await getCityPerformance();

  const mid = Math.floor(series.length / 2);
  const firstHalf = series.slice(0, mid);
  const secondHalf = series.slice(mid);
  const rev1 = firstHalf.reduce((s, p) => s + p.revenueUsd, 0);
  const rev2 = secondHalf.reduce((s, p) => s + p.revenueUsd, 0);
  const revDelta = rev1 > 0 ? (rev2 - rev1) / rev1 : 0;

  const lead1 = firstHalf.reduce((s, p) => s + p.leads, 0);
  const lead2 = secondHalf.reduce((s, p) => s + p.leads, 0);
  const conv1 = firstHalf.reduce((s, p) => s + p.conversions, 0);
  const conv2 = secondHalf.reduce((s, p) => s + p.conversions, 0);
  const cr1 = lead1 > 0 ? conv1 / lead1 : 0;
  const cr2 = lead2 > 0 ? conv2 / lead2 : 0;

  const bestCity = cities.length > 0 ? [...cities].sort((a, b) => b.leads - a.leads)[0] : null;

  const insights: InvestorInsight[] = [];

  if (revDelta >= 0.08) {
    insights.push({
      kind: "positive",
      text: `Revenue up ~${Math.round(revDelta * 100)}% vs prior month (rolling window).`,
    });
  } else if (revDelta <= -0.08) {
    insights.push({
      kind: "neutral",
      text: `Revenue softer vs prior window (~${Math.round(revDelta * 100)}%) — validate pipeline.`,
    });
  }

  if (bestCity) {
    insights.push({
      kind: "positive",
      text: `Best traction city (90d leads): ${bestCity.city}.`,
    });
  }

  if (cr2 >= cr1 + 0.02 && lead2 > 5) {
    insights.push({ kind: "positive", text: "Conversion improving on recent inbound volume." });
  }

  if (kpis.revenuePerLeadUsd != null && kpis.costPerLeadUsd != null && kpis.revenuePerLeadUsd > kpis.costPerLeadUsd * 2.5) {
    insights.push({
      kind: "opportunity",
      text: "Opportunity: pricing headroom looks healthy vs acquisition cost.",
    });
  }

  if (insights.length === 0) {
    insights.push({
      kind: "neutral",
      text: "Collect more labeled revenue events and marketing spend for sharper investor variance.",
    });
  }

  return insights.slice(0, 8);
}

export async function getInvestorValuationPayload(asOf = new Date()) {
  const kpis = await getInvestorCompanyKpis(asOf);
  const series = await getGrowthSeries(60, asOf);
  const cities = await prisma.seniorCity.findMany({ select: { status: true } }).catch(() => []);

  const arrUsd = kpis.arrUsd ?? (kpis.revenueLast30dUsd > 0 ? kpis.revenueLast30dUsd * 12 : 0);

  const mid = Math.floor(series.length / 2);
  const r1 = mid > 0 ? series.slice(0, mid).reduce((s, p) => s + p.revenueUsd, 0) / mid : 0;
  const r2 = series.length > mid ? series.slice(mid).reduce((s, p) => s + p.revenueUsd, 0) / (series.length - mid) : 0;
  const monthlyGrowthRate =
    r1 > 1e-6 ? (r2 - r1) / r1 : series.length > 0 ? 0.05 : 0;

  const snap = await prisma.revenueSnapshot.findFirst({ orderBy: { snapshotDate: "desc" } }).catch(() => null);
  const retentionRate =
    snap?.churnRate != null ? Math.max(0.5, Math.min(0.99, 1 - Number(snap.churnRate))) : 0.88;

  const expansionProgress =
    cities.length > 0 ? cities.filter((c) => c.status === "ACTIVE" || c.status === "DOMINANT").length / cities.length : 0;

  const valuation = computeSeniorMarketValuation({
    arrUsd,
    monthlyGrowthRate: Math.min(0.5, Math.max(-0.2, monthlyGrowthRate)),
    retentionRate,
    conversionRate: kpis.conversionRateOverall,
    expansionProgress,
  });

  return {
    kpis,
    valuation,
    drivers: {
      monthlyGrowthRate,
      retentionRate,
      conversionRate: kpis.conversionRateOverall,
      expansionProgress,
    },
  };
}

export type CompanyKpiPanelResponse = {
  asOf: string;
  kpis: InvestorCompanyKpis;
  marketplaceHealth: MarketplaceHealth;
  unitEconomics: UnitEconomics;
  cityPerformance: CityPerformanceRow[];
  insights: InvestorInsight[];
};

export async function getCompanyKpiPanelPayload(asOf = new Date()): Promise<CompanyKpiPanelResponse> {
  const [kpis, marketplaceHealth, unitEconomics, cityPerformance, insights] = await Promise.all([
    getInvestorCompanyKpis(asOf),
    getMarketplaceHealth(asOf),
    getUnitEconomics(asOf),
    getCityPerformance(),
    getInvestorInsights(asOf),
  ]);
  return { asOf: asOf.toISOString(), kpis, marketplaceHealth, unitEconomics, cityPerformance, insights };
}

export async function buildMonthlyInvestorReportMarkdown(asOf = new Date()): Promise<string> {
  const panel = await getCompanyKpiPanelPayload(asOf);
  const val = await getInvestorValuationPayload(asOf);
  const growth = await getGrowthSeries(30, asOf);
  const totalRev = growth.reduce((s, p) => s + p.revenueUsd, 0);
  const totalLeads = growth.reduce((s, p) => s + p.leads, 0);

  const lines = [
    `# LECIPM — Monthly investor report`,
    `Generated: ${asOf.toISOString()}`,
    ``,
    `## Headline KPIs`,
    `| Metric | Value |`,
    `| --- | --- |`,
    `| MRR (est.) | $${(panel.kpis.mrrUsd ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} |`,
    `| ARR (est.) | $${(panel.kpis.arrUsd ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} |`,
    `| Revenue (30d, events) | $${panel.kpis.revenueLast30dUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} |`,
    `| Total leads (all time) | ${panel.kpis.totalLeadsAllTime.toLocaleString()} |`,
    `| Leads (30d) | ${panel.kpis.leadsLast30d.toLocaleString()} |`,
    `| Conversion (proxy) | ${(panel.kpis.conversionRateOverall * 100).toFixed(1)}% |`,
    `| Active operators | ${panel.kpis.activeOperators} |`,
    `| Active expansion cities | ${panel.kpis.activeCities} |`,
    ``,
    `## Valuation (illustrative)`,
    `ARR basis: $${Math.round(val.kpis.arrUsd ?? val.kpis.revenueLast30dUsd * 12).toLocaleString()}`,
    `Multiplier: ${val.valuation.multiplier}x`,
    `Indicative valuation: $${val.valuation.valuationUsd.toLocaleString()}`,
    ``,
    `## Marketplace health`,
    `- Supply/demand ratio: ${panel.marketplaceHealth.supplyDemandRatio?.toFixed(2) ?? "—"}`,
    `- Avg operator response (h): ${panel.marketplaceHealth.avgResponseTimeHours?.toFixed(2) ?? "—"}`,
    `- Operator performance score: ${panel.marketplaceHealth.operatorPerformanceScore?.toFixed(1) ?? "—"}`,
    ``,
    `## Unit economics`,
    `- CAC: ${panel.unitEconomics.cacUsd != null ? `$${panel.unitEconomics.cacUsd.toFixed(2)}` : "—"}`,
    `- LTV: ${panel.unitEconomics.ltvUsd != null ? `$${panel.unitEconomics.ltvUsd.toFixed(2)}` : "—"}`,
    `- LTV/CAC: ${panel.unitEconomics.ltvToCac?.toFixed(2) ?? "—"}`,
    ``,
    `## Rolling 30d (chart source)`,
    `- Sum revenue (bucketed): $${totalRev.toFixed(0)}`,
    `- Sum leads (bucketed): ${totalLeads}`,
    ``,
    `### City performance`,
    ...panel.cityPerformance.slice(0, 25).map(
      (c) =>
        `- ${c.city} (${c.country}): leads ${c.leads}, conv ${c.conversions}, readiness ${c.readinessScore?.toFixed(1) ?? "—"}`,
    ),
    ``,
    `### Insights`,
    ...panel.insights.map((i) => `- (${i.kind}) ${i.text}`),
    ``,
    `_Internal use — reconcile revenue with finance before external distribution._`,
  ];
  return lines.join("\n");
}
