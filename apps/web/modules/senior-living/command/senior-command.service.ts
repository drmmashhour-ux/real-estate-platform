/**
 * Aggregations for Senior Living Command Center — lightweight counts + capped lists.
 */
import { prisma } from "@/lib/db";
import { computeFinalLeadPriceCents } from "@/modules/senior-living/ai/senior-dynamic-pricing.service";
import { getLatestScoresForLeads } from "@/modules/senior-living/lead-scoring.service";
import type { LeadBand } from "@/modules/senior-living/lead-scoring.service";

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export type CommandKpisPayload = {
  leadsToday: number;
  leadsWeek: number;
  highQualityPct: number | null;
  visitsBookedWeek: number;
  conversionsWeek: number;
  avgResponseTimeHours: number | null;
  avgLeadPriceCad: number | null;
  revenueDailyCad: number | null;
  revenueMonthlyCad: number | null;
  generatedAt: string;
};

export async function getSeniorCommandKpis(): Promise<CommandKpisPayload> {
  const now = new Date();
  const todayStart = startOfUtcDay(now);
  const weekStart = daysAgo(7);
  const monthStart = daysAgo(30);

  const [
    leadsToday,
    leadsWeek,
    leadsMonthSample,
    visitEventsWeek,
    convertedEventsWeek,
    perfRows,
    pricingRules,
  ] = await Promise.all([
    prisma.seniorLead.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.seniorLead.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.seniorLead.findMany({
      where: { createdAt: { gte: monthStart } },
      select: { id: true, residence: { select: { city: true } } },
      take: 400,
    }),
    prisma.matchingEvent.count({
      where: { eventType: "VISIT", createdAt: { gte: weekStart } },
    }),
    prisma.matchingEvent.count({
      where: { eventType: "CONVERTED", createdAt: { gte: weekStart } },
    }),
    prisma.seniorOperatorPerformance.findMany({
      select: { responseTimeAvg: true },
      take: 200,
    }),
    prisma.seniorPricingRule.findMany({ orderBy: { updatedAt: "desc" }, take: 80 }),
  ]);

  const leadsClosedWeek = await prisma.seniorLead.count({
    where: {
      status: "CLOSED",
      createdAt: { gte: weekStart },
    },
  });

  const recentLeadIds = (
    await prisma.seniorLead.findMany({
      where: { createdAt: { gte: weekStart } },
      select: { id: true },
      take: 500,
    })
  ).map((x) => x.id);

  const scoreMap = await getLatestScoresForLeads(recentLeadIds);
  let high = 0;
  let totalScored = 0;
  for (const id of recentLeadIds) {
    const s = scoreMap.get(id);
    if (!s) continue;
    totalScored++;
    if ((s.band as LeadBand) === "HIGH") high++;
  }

  const highQualityPct =
    totalScored > 0 ? Math.round((1000 * high) / totalScored) / 10 : null;

  const rts = perfRows.map((p) => p.responseTimeAvg).filter((x): x is number => x != null && x >= 0);
  const avgResponseTimeHours =
    rts.length > 0 ? Math.round((rts.reduce((a, b) => a + b, 0) / rts.length) * 10) / 10 : null;

  const basePrice =
    pricingRules.length > 0 ?
      pricingRules.reduce((s, r) => s + r.leadBasePrice, 0) / pricingRules.length
    : 49;

  let priceSamples = 0;
  let priceSumCad = 0;
  for (const row of leadsMonthSample.slice(0, 80)) {
    try {
      const q = await computeFinalLeadPriceCents({
        city: row.residence.city,
        leadQualityScore: 62,
        conversionProbability: 0.35,
      });
      priceSumCad += q.priceCents / 100;
      priceSamples++;
    } catch {
      priceSumCad += basePrice;
      priceSamples++;
    }
  }
  const avgLeadPriceCad =
    priceSamples > 0 ? Math.round((priceSumCad / priceSamples) * 100) / 100 : Math.round(basePrice * 100) / 100;

  const revenueDailyCad =
    leadsToday > 0 && avgLeadPriceCad != null ? Math.round(leadsToday * avgLeadPriceCad * 100) / 100 : 0;
  const revenueMonthlyCad =
    avgLeadPriceCad != null ?
      Math.round(prismaRawLeadCountMonthlyEstimate(leadsWeek, avgLeadPriceCad) * 100) / 100
    : null;

  return {
    leadsToday,
    leadsWeek,
    highQualityPct,
    visitsBookedWeek: visitEventsWeek,
    conversionsWeek: Math.max(convertedEventsWeek, leadsClosedWeek),
    avgResponseTimeHours,
    avgLeadPriceCad,
    revenueDailyCad,
    revenueMonthlyCad,
    generatedAt: now.toISOString(),
  };
}

function prismaRawLeadCountMonthlyEstimate(leadsWeek: number, avg: number): number {
  const monthlyLeadEstimate = Math.round((leadsWeek / 7) * 30);
  return monthlyLeadEstimate * avg;
}

export type HotLeadRow = {
  id: string;
  requesterName: string;
  emailMasked: string;
  urgency: "HIGH" | "MEDIUM" | "LOW";
  budget: number | null;
  careLevel: string | null;
  residenceName: string;
  residenceCity: string;
  operatorName: string | null;
  status: string;
  score: number | null;
  band: string | null;
  probability: number | null;
  createdAt: string;
};

export async function getHotLeads(limit = 12): Promise<HotLeadRow[]> {
  const leads = await prisma.seniorLead.findMany({
    orderBy: { createdAt: "desc" },
    take: 120,
    include: {
      residence: {
        select: {
          name: true,
          city: true,
          careLevel: true,
          operator: { select: { name: true, email: true } },
        },
      },
    },
  });

  const ids = leads.map((l) => l.id);
  const legacyScores = await getLatestScoresForLeads(ids);
  const aiScores = await prisma.seniorLeadScore.findMany({
    where: { leadId: { in: ids } },
    orderBy: { createdAt: "desc" },
  });
  const aiLatest = new Map<string, (typeof aiScores)[0]>();
  for (const r of aiScores) {
    if (!aiLatest.has(r.leadId)) aiLatest.set(r.leadId, r);
  }

  type Ranked = HotLeadRow & { sortKey: number };
  const ranked: Ranked[] = [];

  for (const l of leads) {
    const leg = legacyScores.get(l.id);
    const ai = aiLatest.get(l.id);
    const score =
      ai != null && leg != null ? Math.max(ai.score, leg.score)
      : ai?.score ?? leg?.score ?? null;
    const band = (ai?.band ?? leg?.band ?? "LOW") as string;
    const probability = ai?.probability ?? leg?.probability ?? null;

    const recent = Date.now() - l.createdAt.getTime() < 7 * 86400000;
    const highBand = band === "HIGH";
    const sortKey =
      (highBand ? 1000 : 0) + (recent ? 100 : 0) + (score ?? 0) + (probability ?? 0) * 50;

    if (!(highBand || (score != null && score >= 68) || (probability != null && probability >= 0.65))) {
      continue;
    }

    ranked.push({
      id: l.id,
      requesterName: l.requesterName,
      emailMasked: maskEmail(l.email),
      urgency:
        band === "HIGH" || (score != null && score >= 82) ? "HIGH"
        : band === "MEDIUM" ? "MEDIUM"
        : "LOW",
      budget: l.budget,
      careLevel: l.needsLevel ?? l.residence.careLevel ?? null,
      residenceName: l.residence.name,
      residenceCity: l.residence.city,
      operatorName:
        l.residence.operator?.name?.trim() ||
        l.residence.operator?.email?.split("@")[0] ||
        null,
      status: l.status,
      score,
      band,
      probability,
      createdAt: l.createdAt.toISOString(),
      sortKey,
    });
  }

  ranked.sort((a, b) => b.sortKey - a.sortKey);
  return ranked.slice(0, limit).map(({ sortKey: _, ...rest }) => rest);
}

function maskEmail(email: string): string {
  const [u, d] = email.split("@");
  if (!d) return "***";
  const safe = u.length <= 2 ? "*" : `${u.slice(0, 2)}…`;
  return `${safe}@${d}`;
}

export type StuckDealRow = {
  leadId: string;
  residenceName: string;
  city: string;
  status: string;
  lastActivityAt: string;
  issue: string;
};

export async function getStuckDeals(limit = 20): Promise<StuckDealRow[]> {
  const sixHoursAgo = new Date(Date.now() - 6 * 3600000);
  const sevenDaysAgo = daysAgo(7);

  const stuckNew = await prisma.seniorLead.findMany({
    where: {
      status: "NEW",
      createdAt: { lt: sixHoursAgo },
    },
    orderBy: { createdAt: "asc" },
    take: 40,
    include: {
      residence: { select: { name: true, city: true } },
    },
  });

  const stuckContacted = await prisma.seniorLead.findMany({
    where: {
      status: "CONTACTED",
      createdAt: { lt: sevenDaysAgo },
    },
    orderBy: { createdAt: "asc" },
    take: 30,
    include: {
      residence: { select: { name: true, city: true } },
    },
  });

  const rows: StuckDealRow[] = [];
  for (const l of stuckNew) {
    rows.push({
      leadId: l.id,
      residenceName: l.residence.name,
      city: l.residence.city,
      status: l.status,
      lastActivityAt: l.createdAt.toISOString(),
      issue: "No response within 6 hours — operator may be overloaded.",
    });
  }
  for (const l of stuckContacted) {
    rows.push({
      leadId: l.id,
      residenceName: l.residence.name,
      city: l.residence.city,
      status: l.status,
      lastActivityAt: l.createdAt.toISOString(),
      issue: "Contacted but no visit booked — possible hesitation or scheduling friction.",
    });
  }

  const perfSlow = await prisma.seniorOperatorPerformance.findMany({
    where: { responseTimeAvg: { gt: 24 } },
    include: {
      residence: { select: { name: true, city: true } },
    },
    take: 15,
  });
  const slowLeadIds = new Set(rows.map((r) => r.leadId));
  for (const p of perfSlow) {
    const lead = await prisma.seniorLead.findFirst({
      where: {
        residenceId: p.residenceId,
        status: { in: ["NEW", "CONTACTED"] },
      },
      orderBy: { createdAt: "desc" },
    });
    if (!lead || slowLeadIds.has(lead.id)) continue;
    slowLeadIds.add(lead.id);
    rows.push({
      leadId: lead.id,
      residenceName: p.residence.name,
      city: p.residence.city,
      status: lead.status,
      lastActivityAt: lead.createdAt.toISOString(),
      issue: "Slow operator response average — escalation recommended.",
    });
  }

  return rows.slice(0, limit);
}

export type OperatorSummaryRow = {
  operatorId: string;
  operatorName: string;
  residenceCount: number;
  /** First residence id — deep links use residence-scoped operator UI. */
  primaryResidenceId: string | null;
  avgResponseHours: number | null;
  conversionRate: number | null;
  leadAcceptanceRate: number | null;
  rankingScore: number | null;
  trustScore: number | null;
  tier: "green" | "yellow" | "red";
};

export async function getOperatorSummaries(): Promise<OperatorSummaryRow[]> {
  const residences = await prisma.seniorResidence.findMany({
    select: {
      operatorId: true,
      operator: { select: { id: true, name: true, email: true } },
      id: true,
    },
    take: 400,
  });

  const byOp = new Map<
    string,
    {
      name: string;
      resIds: string[];
    }
  >();
  for (const r of residences) {
    const oid = r.operatorId;
    if (!oid) continue;
    const label = r.operator?.name?.trim() || r.operator?.email?.split("@")[0] || "Operator";
    const cur = byOp.get(oid) ?? { name: label, resIds: [] };
    cur.resIds.push(r.id);
    byOp.set(oid, cur);
  }

  const perfRows = await prisma.seniorOperatorPerformance.findMany({
    include: {
      residence: { select: { operatorId: true, id: true } },
    },
    take: 400,
  });

  const perfByOp = new Map<
    string,
    {
      resp: number[];
      conv: number[];
      accept: number[];
      rank: number[];
      trust: number[];
    }
  >();

  for (const p of perfRows) {
    const oid = p.residence.operatorId;
    if (!oid) continue;
    const bucket = perfByOp.get(oid) ?? { resp: [], conv: [], accept: [], rank: [], trust: [] };
    if (p.responseTimeAvg != null) bucket.resp.push(p.responseTimeAvg);
    if (p.conversionRate != null) bucket.conv.push(p.conversionRate > 1 ? p.conversionRate / 100 : p.conversionRate);
    if (p.leadAcceptanceRate != null)
      bucket.accept.push(p.leadAcceptanceRate > 1 ? p.leadAcceptanceRate / 100 : p.leadAcceptanceRate);
    if (p.operatorScore != null) bucket.rank.push(p.operatorScore);
    if (p.trustScore != null) bucket.trust.push(p.trustScore > 1 ? p.trustScore / 100 : p.trustScore);
    perfByOp.set(oid, bucket);
  }

  function avg(a: number[]): number | null {
    if (a.length === 0) return null;
    return Math.round((a.reduce((x, y) => x + y, 0) / a.length) * 1000) / 1000;
  }

  const out: OperatorSummaryRow[] = [];
  for (const [operatorId, meta] of byOp) {
    const b = perfByOp.get(operatorId);
    const avgResp = b?.resp.length ? avg(b.resp) : null;
    const avgConv = b?.conv.length ? avg(b.conv) : null;
    const avgAccept = b?.accept.length ? avg(b.accept) : null;
    const avgRank = b?.rank.length ? avg(b.rank) : null;
    const avgTrust = b?.trust.length ? avg(b.trust) : null;

    let tier: OperatorSummaryRow["tier"] = "yellow";
    if (avgResp != null && avgResp <= 8 && (avgConv ?? 0) >= 0.08) tier = "green";
    if (avgResp != null && avgResp > 18) tier = "red";
    if ((avgConv ?? 0) < 0.03 && avgConv != null) tier = "red";

    out.push({
      operatorId,
      operatorName: meta.name,
      residenceCount: meta.resIds.length,
      primaryResidenceId: meta.resIds[0] ?? null,
      avgResponseHours: avgResp,
      conversionRate: avgConv,
      leadAcceptanceRate: avgAccept,
      rankingScore: avgRank,
      trustScore: avgTrust,
      tier,
    });
  }

  out.sort((a, b) => (b.rankingScore ?? 0) - (a.rankingScore ?? 0));
  return out;
}

export type AreaInsightRow = {
  city: string;
  leads: number;
  conversionRate: number | null;
  avgMatchScore: number | null;
  revenueCad: number | null;
  demandSignal: "high" | "mid" | "low";
  supplySignal: "tight" | "ok" | "strong";
};

export async function getAreaInsights(): Promise<AreaInsightRow[]> {
  const insights = await prisma.seniorAreaInsight.findMany({
    orderBy: { areaScore: "desc" },
    take: 40,
  });

  const leadsByCity = await prisma.seniorLead.groupBy({
    by: ["residenceId"],
    _count: { _all: true },
    where: { createdAt: { gte: daysAgo(90) } },
  });
  const resCity = await prisma.seniorResidence.findMany({
    select: { id: true, city: true },
    take: 500,
  });
  const cityMap = new Map(resCity.map((r) => [r.id, r.city]));

  const cityLeadCount = new Map<string, number>();
  for (const row of leadsByCity) {
    const city = cityMap.get(row.residenceId);
    if (!city) continue;
    cityLeadCount.set(city, (cityLeadCount.get(city) ?? 0) + row._count._all);
  }

  const merged: AreaInsightRow[] = [];
  const seen = new Set<string>();

  for (const i of insights) {
    seen.add(i.city);
    const leads = cityLeadCount.get(i.city) ?? i.activeResidences;
    merged.push({
      city: i.city,
      leads,
      conversionRate: i.averageConversionRate,
      avgMatchScore: i.averageMatchScore,
      revenueCad:
        i.averageConversionRate != null && leads > 0 ?
          Math.round(leads * (i.averageConversionRate / 100) * 120)
        : leads * 45,
      demandSignal: i.areaScore >= 70 ? "high" : i.areaScore >= 45 ? "mid" : "low",
      supplySignal: i.activeResidences < 5 ? "tight" : i.activeResidences > 25 ? "strong" : "ok",
    });
  }

  for (const [city, leads] of cityLeadCount) {
    if (seen.has(city)) continue;
    merged.push({
      city,
      leads,
      conversionRate: null,
      avgMatchScore: null,
      revenueCad: leads * 42,
      demandSignal: leads > 12 ? "high" : leads > 4 ? "mid" : "low",
      supplySignal: "ok",
    });
  }

  merged.sort((a, b) => b.leads - a.leads);
  return merged.slice(0, 24);
}

export type PricingRuleRow = {
  id: string;
  city: string | null;
  leadBasePrice: number;
  minPrice: number;
  maxPrice: number;
  demandFactor: number;
  qualityFactor: number;
  updatedAt: string;
};

export async function getPricingRules(): Promise<PricingRuleRow[]> {
  const rows = await prisma.seniorPricingRule.findMany({
    orderBy: { updatedAt: "desc" },
    take: 60,
  });
  return rows.map((r) => ({
    id: r.id,
    city: r.city,
    leadBasePrice: r.leadBasePrice,
    minPrice: r.minPrice,
    maxPrice: r.maxPrice,
    demandFactor: r.demandFactor,
    qualityFactor: r.qualityFactor,
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export type ActivityItem = {
  at: string;
  label: string;
  kind: "lead" | "visit" | "contract" | "operator" | "ai";
};

export async function getActivityFeed(limit = 40): Promise<ActivityItem[]> {
  const [leads, events, learning] = await Promise.all([
    prisma.seniorLead.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { residence: { select: { city: true, name: true } } },
    }),
    prisma.matchingEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      where: { eventType: { in: ["VISIT", "CONVERTED", "LEAD"] } },
      include: { residence: { select: { name: true, city: true } } },
    }),
    prisma.seniorLearningEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      where: { eventType: { in: ["WEIGHT_UPDATE_RUN", "AREA_INSIGHT_REFRESH"] } },
    }),
  ]);

  const items: ActivityItem[] = [];

  for (const l of leads) {
    items.push({
      at: l.createdAt.toISOString(),
      kind: "lead",
      label: `New lead — ${l.residence.city} (${l.residence.name})`,
    });
  }
  for (const e of events) {
    const t =
      e.eventType === "VISIT" ? "Visit booked"
      : e.eventType === "CONVERTED" ?
        "Contract signed"
      : "Lead signal";
    items.push({
      at: e.createdAt.toISOString(),
      kind: e.eventType === "CONVERTED" ? "contract" : e.eventType === "VISIT" ? "visit" : "lead",
      label: `${t} — ${e.residence.name}`,
    });
  }
  for (const ev of learning) {
    items.push({
      at: ev.createdAt.toISOString(),
      kind: "ai",
      label:
        ev.eventType === "WEIGHT_UPDATE_RUN" ?
          "AI refreshed matching weights (safe bounds)"
        : "Area insights updated",
    });
  }

  items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return items.slice(0, limit);
}

export type CommandAlert = {
  id: string;
  severity: "critical" | "warning" | "info";
  message: string;
};

export async function getCommandAlerts(): Promise<CommandAlert[]> {
  const alerts: CommandAlert[] = [];

  const staleHigh = await prisma.seniorLead.count({
    where: {
      status: "NEW",
      createdAt: { lt: new Date(Date.now() - 2 * 3600000) },
    },
  });
  if (staleHigh > 0) {
    alerts.push({
      id: "uncontacted-new",
      severity: "critical",
      message: `${staleHigh} NEW lead(s) older than 2 hours — prioritize contact.`,
    });
  }

  const slowOps = await prisma.seniorOperatorPerformance.count({
    where: { responseTimeAvg: { gt: 12 } },
  });
  if (slowOps > 0) {
    alerts.push({
      id: "slow-response",
      severity: "warning",
      message: `${slowOps} residence(s) show slow average response — review workload.`,
    });
  }

  const leadsWeek = await prisma.seniorLead.count({
    where: { createdAt: { gte: daysAgo(7) } },
  });
  const prevWeek = await prisma.seniorLead.count({
    where: {
      createdAt: { gte: daysAgo(14), lt: daysAgo(7) },
    },
  });
  if (prevWeek > 5 && leadsWeek > prevWeek * 1.5) {
    alerts.push({
      id: "demand-spike",
      severity: "info",
      message: "Lead volume vs prior week suggests a demand spike — consider pricing/supply review.",
    });
  }

  return alerts;
}

export type AiInsightBullet = {
  title: string;
  detail: string;
};

export async function getAiInsightBullets(): Promise<AiInsightBullet[]> {
  const ops = await getOperatorSummaries();
  const topOp = ops[0];
  const areas = await getAreaInsights();
  const topArea = areas[0];

  const bullets: AiInsightBullet[] = [];
  if (topOp) {
    bullets.push({
      title: "Top operator momentum",
      detail: `${topOp.operatorName} leads ranking score vs peers — reinforce throughput.`,
    });
  }
  if (topArea) {
    bullets.push({
      title: "Growth geography",
      detail: `${topArea.city} shows ${topArea.leads} recent leads — expansion or supply push.`,
    });
  }

  const stuck = await getStuckDeals(5);
  if (stuck.length > 0) {
    bullets.push({
      title: "Leads at risk",
      detail: `${stuck.length} stuck pattern(s) detected — unblock follow-ups.`,
    });
  }

  const laval = areas.find((a) => /laval/i.test(a.city));
  if (laval?.demandSignal === "high") {
    bullets.push({
      title: "Pricing signal",
      detail: `Elevated demand in ${laval.city} — review base lead price if supply is tight.`,
    });
  }

  bullets.push({
    title: "Care segment",
    detail: "Medium-support families convert best when visits happen within 48h — align operator SLAs.",
  });

  return bullets.slice(0, 6);
}

export type LeadDetailPayload = {
  lead: {
    id: string;
    requesterName: string;
    email: string;
    phone: string | null;
    budget: number | null;
    needsLevel: string | null;
    status: string;
    createdAt: string;
  };
  residence: {
    id: string;
    name: string;
    city: string;
    careLevel: string;
    operatorName: string | null;
  };
  scores: {
    legacy: { score: number; band: string; probability: number } | null;
    ai: { score: number; band: string; probability: number } | null;
  };
  features: {
    pagesViewed: number | null;
    budgetMatch: number | null;
    careMatch: number | null;
  } | null;
};

export async function getLeadDetailForCommand(leadId: string): Promise<LeadDetailPayload | null> {
  const lead = await prisma.seniorLead.findUnique({
    where: { id: leadId },
    include: {
      residence: {
        select: {
          id: true,
          name: true,
          city: true,
          careLevel: true,
          operator: { select: { name: true } },
        },
      },
    },
  });
  if (!lead) return null;

  const legacyMap = await getLatestScoresForLeads([leadId]);
  const leg = legacyMap.get(leadId);

  const aiRows = await prisma.seniorLeadScore.findMany({
    where: { leadId },
    orderBy: { createdAt: "desc" },
    take: 1,
  });
  const ai = aiRows[0];

  const snap = await prisma.leadFeatureSnapshot.findFirst({
    where: { leadId },
    orderBy: { createdAt: "desc" },
  });

  return {
    lead: {
      id: lead.id,
      requesterName: lead.requesterName,
      email: lead.email,
      phone: lead.phone,
      budget: lead.budget,
      needsLevel: lead.needsLevel,
      status: lead.status,
      createdAt: lead.createdAt.toISOString(),
    },
    residence: {
      id: lead.residence.id,
      name: lead.residence.name,
      city: lead.residence.city,
      careLevel: lead.residence.careLevel,
      operatorName: lead.residence.operator?.name ?? null,
    },
    scores: {
      legacy:
        leg ?
          { score: leg.score, band: leg.band, probability: leg.probability }
        : null,
      ai:
        ai ?
          { score: ai.score, band: ai.band, probability: ai.probability }
        : null,
    },
    features:
      snap ?
        {
          pagesViewed: snap.pagesViewed,
          budgetMatch: snap.budgetMatch,
          careMatch: snap.careMatch,
        }
      : null,
  };
}
