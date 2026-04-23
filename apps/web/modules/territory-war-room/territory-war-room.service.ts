import { prisma } from "@/lib/db";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";
import { buildCityLaunchFullView } from "@/modules/city-launch/city-launch.service";
import type { LaunchPhaseId } from "@/modules/city-launch/city-launch.types";
import { analyzeMarketGaps } from "@/modules/market-domination/market-gap-analysis.service";
import { getTerritoryDetail, loadTerritories } from "@/modules/market-domination/market-domination.service";
import type { HubPenetrationResult, HubType, MarketGap } from "@/modules/market-domination/market-domination.types";
import { computeHubPenetration } from "@/modules/market-domination/market-penetration.service";
import { buildExpansionContext, playbookCompletionMap } from "@/modules/self-expansion/self-expansion.engine";
import { loadLearningWeights } from "@/modules/self-expansion/self-expansion-learning.service";
import { getNoShowAnalytics } from "@/modules/no-show-prevention/no-show-analytics.service";
import { buildTerritoryRecommendationDraft } from "@/modules/self-expansion/self-expansion-recommendation.service";

export type WarRoomPhase = "DISCOVERY" | "LAUNCH" | "EXPAND" | "DOMINATE";

export type WarRoomStatus = "Healthy" | "At Risk" | "Underperforming";

export type BlockerItem = {
  id: string;
  title: string;
  reason: string;
  severity: "low" | "medium" | "high";
  suggestedFix: string;
  source: string;
};

export type NextActionItem = {
  id: string;
  title: string;
  priority: number;
  rationale: string;
  dataBasis: string;
};

function mapPlaybookPhase(p: LaunchPhaseId): WarRoomPhase {
  switch (p) {
    case "PRE_LAUNCH":
      return "DISCOVERY";
    case "LAUNCH":
    case "EARLY_TRACTION":
      return "LAUNCH";
    case "SCALE":
      return "EXPAND";
    case "DOMINATION":
      return "DOMINATE";
    default:
      return "LAUNCH";
  }
}

function mapExpansionPhaseToWarRoom(
  phase: string | undefined
): WarRoomPhase | null {
  if (!phase) return null;
  if (phase === "DISCOVERY") return "DISCOVERY";
  if (phase === "PREPARE" || phase === "TEST") return "LAUNCH";
  if (phase === "LAUNCH") return "LAUNCH";
  if (phase === "EXPAND") return "EXPAND";
  if (phase === "DOMINATE") return "DOMINATE";
  return null;
}

function statusFromSignals(domScore: number, gaps: MarketGap[]): WarRoomStatus {
  const critical = gaps.some((g) => g.severity === "critical");
  const important = gaps.some((g) => g.severity === "important");
  if (critical || domScore < 34) return "Underperforming";
  if (important || domScore < 52) return "At Risk";
  return "Healthy";
}

const HUB_LABELS: Array<{ label: string; hub: HubType; productKey: string }> = [
  { label: "Listings", hub: "SELLER", productKey: "listings_supply" },
  { label: "Broker", hub: "BROKER", productKey: "broker_bench" },
  { label: "BNHub", hub: "BNHUB", productKey: "bnhub_nights" },
  { label: "Investor", hub: "INVESTOR", productKey: "investor_flow" },
  { label: "Residence services", hub: "RESIDENCE", productKey: "residence_ops" },
];

function penetrationRow(pen: HubPenetrationResult[], hub: HubType) {
  const row = pen.find((x) => x.hub === hub);
  return {
    band: row?.band ?? "LOW",
    score: row ? Math.round(row.score * 100) : 0,
    explain: row?.supportingMetrics?.join(", ") ?? "proxy from territory.metrics",
  };
}

async function loadPlatformBookings() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  try {
    const [today, week] = await Promise.all([
      prisma.booking.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.booking.count({ where: { createdAt: { gte: weekAgo } } }),
    ]);
    return { visitsBookedToday: today, visitsBookedWeek: week };
  } catch {
    return { visitsBookedToday: null, visitsBookedWeek: null };
  }
}

async function loadDealPipeline() {
  const now = new Date();
  const stalledCutoff = new Date(now);
  stalledCutoff.setDate(stalledCutoff.getDate() - 21);
  try {
    const [openCount, priority, stalled, hot] = await Promise.all([
      prisma.deal
        .count({
          where: { status: { notIn: ["closed", "cancelled"] } },
        })
        .catch(() => null),
      prisma.deal.findMany({
        where: {
          status: { notIn: ["closed", "cancelled"] },
          OR: [{ crmStage: { contains: "offer", mode: "insensitive" } }, { status: "accepted" }],
        },
        orderBy: { updatedAt: "desc" },
        take: 6,
        select: {
          id: true,
          dealCode: true,
          status: true,
          crmStage: true,
          updatedAt: true,
        },
      }),
      prisma.deal.findMany({
        where: {
          status: { notIn: ["closed", "cancelled"] },
          updatedAt: { lt: stalledCutoff },
        },
        orderBy: { updatedAt: "asc" },
        take: 6,
        select: {
          id: true,
          dealCode: true,
          status: true,
          crmStage: true,
          updatedAt: true,
        },
      }),
      prisma.deal.findMany({
        where: {
          status: { in: ["offer_submitted", "accepted", "financing"] },
          updatedAt: { gte: stalledCutoff },
        },
        orderBy: { updatedAt: "desc" },
        take: 6,
        select: {
          id: true,
          dealCode: true,
          status: true,
          crmStage: true,
          updatedAt: true,
        },
      }),
    ]);
    return {
      dealsOpenCount: openCount,
      priorityDeals: priority,
      stalledDeals: stalled,
      highProbabilityDeals: hot,
    };
  } catch {
    return {
      dealsOpenCount: null,
      priorityDeals: [],
      stalledDeals: [],
      highProbabilityDeals: [],
    };
  }
}

async function loadLeadVolumeWindow() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  try {
    const [today, week, topSources] = await Promise.all([
      prisma.lead.count({ where: { createdAt: { gte: startOfToday } } }).catch(() => null),
      prisma.lead.count({ where: { createdAt: { gte: weekAgo } } }).catch(() => null),
      prisma.lead
        .groupBy({
          by: ["leadSource"],
          where: { createdAt: { gte: weekAgo } },
          _count: { _all: true },
        })
        .catch(() => []),
    ]);
    const leadSourcesWeek = [...topSources]
      .sort((a, b) => b._count._all - a._count._all)
      .slice(0, 8)
      .map((r) => ({
        source: r.leadSource?.trim() || "unknown",
        count: r._count._all,
      }));
    return {
      leadsToday: today,
      leadsWeek: week,
      leadSourcesWeek,
      leadsNote:
        "CRM `Lead.createdAt` counts — platform-wide until territory_id is denormalized on leads.",
    };
  } catch {
    return {
      leadsToday: null,
      leadsWeek: null,
      leadSourcesWeek: [] as { source: string; count: number }[],
      leadsNote: "Lead counts unavailable.",
    };
  }
}

async function loadMarketingSnapshot() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  try {
    const [campaigns, seoDrafts, bnCampaigns] = await Promise.all([
      prisma.marketingCampaign.count({ where: { updatedAt: { gte: startOfMonth } } }).catch(() => null),
      prisma.seoPageDraft.count().catch(() => null),
      prisma.bnhubGrowthCampaign.count().catch(() => null),
    ]);
    const safeC = campaigns ?? 0;
    const safeSeo = seoDrafts ?? 0;
    const safeBn = bnCampaigns ?? 0;
    const engagementIndex = Math.min(100, Math.round(safeC * 8 + Math.min(safeSeo, 40) * 0.5 + safeBn * 3));
    return {
      activeCampaignsMtd: campaigns,
      seoDrafts,
      bnhubGrowthCampaigns: bnCampaigns,
      engagementIndex,
      engagementNote:
        "Engagement index 0–100: weighted MTD campaigns, SEO draft depth, BNHub growth rows (platform-wide heuristic).",
      leadSourcesNote:
        "Territory row lists top `Lead.leadSource` mix for the last 7 days (platform-wide).",
    };
  } catch {
    return {
      activeCampaignsMtd: null,
      seoDrafts: null,
      bnhubGrowthCampaigns: null,
      engagementIndex: null,
      leadSourcesNote: null,
      engagementNote: null,
    };
  }
}

function buildBlockers(args: {
  territoryId: string;
  gaps: MarketGap[];
  readinessBlockers: string[];
  scoreBlockers: string[];
  conversionRate: number;
  activeBrokers: number;
  listingsCount: number;
  bypassCount: number;
  buyerDemand: number;
  renterDemand: number;
  leadVolumeProxy: number;
  activeCampaignsMtd: number | null;
  engagementIndex: number | null;
  noShowRate7d: number | null;
  visitSample7d: number;
}): BlockerItem[] {
  const out: BlockerItem[] = [];
  let i = 0;

  for (const g of args.gaps) {
    out.push({
      id: `gap-${g.id}`,
      title: g.gapType.replace(/_/g, " "),
      reason: g.whyItMatters,
      severity: g.severity === "critical" ? "high" : g.severity === "important" ? "medium" : "low",
      suggestedFix: g.recommendedNextMove,
      source: "market_gap_analysis",
    });
  }

  for (const b of args.readinessBlockers.slice(0, 4)) {
    out.push({
      id: `rd-${i++}`,
      title: "Readiness",
      reason: b,
      severity: "medium",
      suggestedFix: "Align city playbook steps + broker recruiting cadence.",
      source: "expansion_readiness",
    });
  }

  for (const b of args.scoreBlockers.slice(0, 3)) {
    out.push({
      id: `sb-${i++}`,
      title: "Expansion score",
      reason: b,
      severity: "medium",
      suggestedFix: "Review self-expansion recommendation + supply initiatives.",
      source: "self_expansion_scoring",
    });
  }

  if (args.activeBrokers < 28 && args.listingsCount > 100) {
    out.push({
      id: "broker-supply",
      title: "Low broker supply vs inventory",
      reason: `Broker bench (${args.activeBrokers}) is thin relative to listing depth.`,
      severity: "high",
      suggestedFix: "Recruit licensed brokers with territory routing SLAs.",
      source: "heuristic",
    });
  }

  if (args.conversionRate < 0.13) {
    out.push({
      id: "conversion",
      title: "Low conversion",
      reason: `Conversion proxy ${(args.conversionRate * 100).toFixed(1)}% — speed-to-lead or offer-market fit.`,
      severity: "medium",
      suggestedFix: "Tighten routing + objection coaching; audit landing alignment.",
      source: "territory.metrics.conversionRate",
    });
  }

  if (args.bypassCount > 0) {
    out.push({
      id: "compliance-bypass",
      title: "Deal compliance flags",
      reason: `${args.bypassCount} open deals flagged for possible bypass review.`,
      severity: "high",
      suggestedFix: "Review ImmoContact linkage on flagged deals.",
      source: "deal.possibleBypassFlag",
    });
  }

  const demandUnits = args.buyerDemand + args.renterDemand;
  if (args.listingsCount < 48 && demandUnits > 140) {
    out.push({
      id: "low-listings",
      title: "Low listings vs demand",
      reason: `Listing depth (${args.listingsCount}) lags modeled demand (${demandUnits}) on territory.metrics.`,
      severity: "high",
      suggestedFix: "Run FSBO/acquisition pushes and seller BNHub bundles in this zone.",
      source: "territory.metrics heuristic",
    });
  }

  const campaigns = args.activeCampaignsMtd ?? 0;
  const eng = args.engagementIndex ?? 0;
  if (args.leadVolumeProxy > 72 && campaigns < 2 && eng < 38) {
    out.push({
      id: "low-marketing-engagement",
      title: "Thin marketing activation",
      reason: `High territory lead proxy (${args.leadVolumeProxy}) but weak MTD activation (campaigns ${campaigns}, engagement index ${eng}).`,
      severity: "medium",
      suggestedFix: "Increase paid + content cadence; tie campaigns to BNHub corridors.",
      source: "marketing_engine vs territory.metrics.leadVolume",
    });
  }

  if (
    args.noShowRate7d !== null &&
    args.visitSample7d >= 24 &&
    args.noShowRate7d > 0.17
  ) {
    out.push({
      id: "high-no-show",
      title: "High visit no-show rate",
      reason: `Past 7d no-show rate ${(args.noShowRate7d * 100).toFixed(1)}% across ${args.visitSample7d} tracked visits.`,
      severity: "high",
      suggestedFix: "Turn on reminder cadence + narrow booking windows; review risky sources.",
      source: "lecipm_visit + no-show analytics",
    });
  }

  return out.slice(0, 16);
}

function buildNextActions(args: {
  gaps: MarketGap[];
  expansionFirstActions: string[];
  expansionTitle: string;
  territoryName: string;
  territoryId: string;
  gapSummary: "high_demand_low_supply" | "oversupply_low_conversion" | "balanced" | "watch";
  listingsCount: number;
  buyerDemand: number;
  activeBrokers: number;
  bnhubBand: string;
  leadVolumeProxy: number;
}): NextActionItem[] {
  const actions: NextActionItem[] = [];
  let p = 130;

  if (args.activeBrokers < 38 || args.gapSummary === "high_demand_low_supply") {
    actions.push({
      id: "act-recruit-5-zone",
      title: `Recruit 5 brokers in ${args.territoryName}`,
      priority: p--,
      rationale: `Bench ${args.activeBrokers} vs modeled demand ${args.buyerDemand} — protect tour SLAs and routing.`,
      dataBasis: "territory.metrics.activeBrokers vs buyerDemand + gapSummary",
      href: "/dashboard/admin/growth-leads",
    });
  }

  if (args.gapSummary === "high_demand_low_supply" || (args.listingsCount < 56 && args.buyerDemand > 118)) {
    actions.push({
      id: "act-listings-supply",
      title: "Increase listings supply",
      priority: p--,
      rationale: `Depth ${args.listingsCount} listings vs intent-heavy demand signals.`,
      dataBasis: "supplyDemand ratio + listingsCount",
      href: "/dashboard/admin/marketing/studio",
    });
  }

  if (args.bnhubBand === "LOW") {
    actions.push({
      id: "act-bnhub-tourist",
      title: "Launch BNHub activation in tourist / stay-heavy micro-zones",
      priority: p--,
      rationale: "BNHub penetration band LOW — density unlocks nights + cross-sell for listings tours.",
      dataBasis: "hub_penetration.BNHUB band",
      href: `/dashboard/admin/city-launch/${args.territoryId}`,
    });
  }

  if (args.gapSummary === "high_demand_low_supply" || args.leadVolumeProxy > 78) {
    actions.push({
      id: "act-marketing-demand-segment",
      title: "Boost marketing in highest-demand buyer segment",
      priority: p--,
      rationale: "Pair demand hotspots with targeted tours + retargeting before inventory catches up.",
      dataBasis: "gapSummary + territory.metrics.leadVolume",
      href: "/dashboard/admin/marketing/studio",
    });
  }

  for (const g of args.gaps.slice(0, 4)) {
    actions.push({
      id: `act-gap-${g.id}`,
      title: g.recommendedNextMove.slice(0, 120),
      priority: p--,
      rationale: g.whyItMatters,
      dataBasis: `Gap ${g.gapType} (${g.severity})`,
      href: "/dashboard/admin/market-domination",
    });
  }

  for (const [idx, line] of args.expansionFirstActions.entries()) {
    actions.push({
      id: `act-exp-${idx}`,
      title: line,
      priority: p--,
      rationale: args.expansionTitle,
      dataBasis: "self_expansion.entry_strategy",
      href: `/dashboard/admin/self-expansion/${args.territoryId}`,
    });
  }

  actions.push({
    id: "act-recruit-micro",
    title: `Recruit brokers in ${args.territoryName} micro-market`,
    priority: 68,
    rationale: "Bench depth unlocks SLA on inbound intent.",
    dataBasis: "territory.metrics.activeBrokers vs leadVolume",
    href: "/dashboard/admin/growth-leads",
  });

  const seen = new Set<string>();
  const deduped: NextActionItem[] = [];
  for (const a of actions.sort((x, y) => y.priority - x.priority)) {
    const key = `${a.title}|${a.dataBasis}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(a);
  }
  return deduped.slice(0, 12);
}

export async function buildTerritoryWarRoomPayload(territoryId: string) {
  const territories = loadTerritories();
  const territory = territories.find((t) => t.id === territoryId);
  if (!territory) return null;

  const detail = getTerritoryDetail(territoryId);
  const gaps = analyzeMarketGaps([territory]).filter((g) => g.territoryId === territoryId);
  const pen = computeHubPenetration(territory.metrics);
  const playbook = buildCityLaunchFullView(territoryId);

  const ctx = await buildExpansionContext();
  const profile = ctx.territories.find((t) => t.territoryId === territoryId);
  const learning = await loadLearningWeights();
  const playbookPct = (await playbookCompletionMap())[territoryId] ?? null;

  const expansionDraft =
    profile ?
      buildTerritoryRecommendationDraft(profile, ctx, learning, playbookPct)
    : null;

  const domScore = detail?.domination?.score ?? 0;
  const supplyDemandRatio = territory.metrics.supplyDemandRatio;
  let gapSummary: "high_demand_low_supply" | "oversupply_low_conversion" | "balanced" | "watch" =
    "balanced";
  if (supplyDemandRatio < 0.88 && territory.metrics.buyerDemand + territory.metrics.renterDemand > 120) {
    gapSummary = "high_demand_low_supply";
  } else if (supplyDemandRatio > 1.12 && territory.metrics.conversionRate < 0.14) {
    gapSummary = "oversupply_low_conversion";
  } else if (gaps.some((g) => g.severity !== "watch")) {
    gapSummary = "watch";
  }

  const playbookPhase = playbook?.currentPhaseId;
  const derivedPhase: WarRoomPhase =
    mapExpansionPhaseToWarRoom(expansionDraft?.phaseSuggested) ??
    (playbookPhase ? mapPlaybookPhase(playbookPhase) : "LAUNCH");

  const opsState = await prisma.lecipmTerritoryWarRoomState.findUnique({
    where: { territoryId },
  }).catch(() => null);

  const displayPhase: WarRoomPhase =
    (opsState?.phaseOverride as WarRoomPhase | null) ?? derivedPhase;

  const status = statusFromSignals(domScore, gaps);

  const [leadWindow, bookings, deals, marketing, noShow7d] = await Promise.all([
    loadLeadVolumeWindow(),
    loadPlatformBookings(),
    loadDealPipeline(),
    loadMarketingSnapshot(),
    getNoShowAnalytics({ periodDays: 7 }).catch(() => null),
  ]);

  let bypassCount = 0;
  try {
    bypassCount = await prisma.deal.count({
      where: { possibleBypassFlag: true, status: { notIn: ["closed", "cancelled"] } },
    });
  } catch {
    bypassCount = 0;
  }

  const readinessBlockers = detail?.readiness?.blockers ?? [];
  const scoreBlockers = expansionDraft?.scoreBreakdown.blockers ?? [];

  const hubRows = HUB_LABELS.map((h) => {
    const row = penetrationRow(pen, h.hub);
    return {
      label: h.label,
      hub: h.hub,
      activityBand: row.band,
      activityScore: row.score,
      growthNote: `Penetration score ${row.score}/100 — drivers: ${row.explain}`,
      gapNote:
        row.band === "LOW" ?
          "Low relative penetration — push acquisition + routing for this hub."
        : "Within band — maintain retention.",
    };
  });

  const bnhubBand = hubRows.find((r) => r.hub === "BNHUB")?.activityBand ?? "LOW";

  const blockers = buildBlockers({
    territoryId,
    gaps,
    readinessBlockers,
    scoreBlockers,
    conversionRate: territory.metrics.conversionRate,
    activeBrokers: territory.metrics.activeBrokers,
    listingsCount: territory.metrics.listingsCount,
    bypassCount,
    buyerDemand: territory.metrics.buyerDemand,
    renterDemand: territory.metrics.renterDemand,
    leadVolumeProxy: territory.metrics.leadVolume,
    activeCampaignsMtd: marketing.activeCampaignsMtd,
    engagementIndex: marketing.engagementIndex,
    noShowRate7d: noShow7d?.noShowRate ?? null,
    visitSample7d: noShow7d?.trendVisits ?? 0,
  });

  const nextActions = buildNextActions({
    gaps,
    expansionFirstActions: expansionDraft?.firstActions ?? [],
    expansionTitle: expansionDraft?.title ?? "Expansion",
    territoryName: territory.name,
    territoryId,
    gapSummary,
    listingsCount: territory.metrics.listingsCount,
    buyerDemand: territory.metrics.buyerDemand,
    activeBrokers: territory.metrics.activeBrokers,
    bnhubBand,
    leadVolumeProxy: territory.metrics.leadVolume,
  });

  const revenueBand =
    territory.metrics.revenueCents > 300_000_000 ? "high"
    : territory.metrics.revenueCents > 120_000_000 ? "mid"
    : "developing";

  return {
    generatedAt: new Date().toISOString(),
    territoryId,
    territoryName: territory.name,
    regionLabel: territory.regionLabel,
    disclaimers: [
      "Territory metrics come from Market Domination seeds + playbook — calibrate with warehouse rollups.",
      "Deals, bookings, and marketing counts are platform-wide until geo filters land on those tables.",
    ],
    header: {
      cityName: territory.name,
      phase: displayPhase,
      phaseDerived: derivedPhase,
      expansionScore: expansionDraft?.expansionScore ?? null,
      expansionBand: expansionDraft?.recommendationActionBand ?? null,
      status,
      paused: opsState?.paused ?? false,
      scaling: opsState?.scaling ?? false,
      dominationScore: domScore,
    },
    ops: {
      phaseOverride: opsState?.phaseOverride ?? null,
      expansionPlanNote: opsState?.expansionPlanNote ?? null,
      playbookPhase: playbookPhase ?? null,
      playbookCompletionPercent: playbook?.progress.completionPercent ?? null,
    },
    coreMetrics: {
      leadsTerritoryProxy: {
        rolling: territory.metrics.leadVolume,
        note: "leadVolume is a normalized proxy — not raw CRM row count.",
      },
      activeListings: territory.metrics.listingsCount,
      brokersOnboarded: territory.metrics.activeBrokers,
      visitsBookedToday: bookings.visitsBookedToday,
      visitsBookedWeek: bookings.visitsBookedWeek,
      visitsNote: "Booking counts are platform-wide (createdAt window).",
      dealsInProgress: deals.dealsOpenCount,
      dealsNote: "Deal lists are platform-wide pipeline slices for triage — not geo-filtered.",
      revenueBand,
      revenueCentsProxy: territory.metrics.revenueCents,
      conversionRate: territory.metrics.conversionRate,
    },
    supplyDemand: {
      listingsSupply: territory.metrics.listingsCount,
      buyerDemand: territory.metrics.buyerDemand,
      renterDemand: territory.metrics.renterDemand,
      ratio: supplyDemandRatio,
      gapSummary,
      highlight:
        gapSummary === "high_demand_low_supply" ? "High demand, low supply"
        : gapSummary === "oversupply_low_conversion" ? "Oversupply, low conversion"
        : gapSummary === "watch" ? "Gap signals present — review blockers"
        : "Balanced vs proxies",
    },
    hubPerformance: hubRows,
    dealIntelligence: {
      ...deals,
      quickActionNote: "Open deal workspace from pipeline; links use /dashboard/deals/{id}.",
    },
    marketing: {
      ...marketing,
      contentPosted: marketing.seoDrafts,
      topLeadSourcesWeek: leadWindow.leadSourcesWeek,
    },
    blockers,
    nextActions,
    expansion: expansionDraft ?
      {
        title: expansionDraft.title,
        summary: expansionDraft.summary,
        entryHub: expansionDraft.entryHub,
        phasedPlanSummary: expansionDraft.phasedPlanSummary,
        linkSelfExpansion: `/dashboard/admin/self-expansion/${territoryId}`,
      }
    : null,
    capitalAllocatorNote:
      "Capital allocator moves remain approval-gated — review allocator queues before deploying.",
    map: {
      enabled: false,
      message:
        "Geo heatmap (listings density, demand hotspots, broker density) ships when inventory geocoding is wired.",
    },
  };
}

export async function updateTerritoryWarRoomState(params: {
  territoryId: string;
  actorUserId: string;
  phaseOverride?: WarRoomPhase | null;
  paused?: boolean;
  scaling?: boolean;
  expansionPlanNote?: string | null;
}) {
  await prisma.lecipmTerritoryWarRoomState.upsert({
    where: { territoryId: params.territoryId },
    create: {
      territoryId: params.territoryId,
      phaseOverride: params.phaseOverride ?? null,
      paused: params.paused ?? false,
      scaling: params.scaling ?? false,
      expansionPlanNote: params.expansionPlanNote ?? null,
      updatedByUserId: params.actorUserId,
    },
    update: {
      ...(params.phaseOverride !== undefined ? { phaseOverride: params.phaseOverride } : {}),
      ...(params.paused !== undefined ? { paused: params.paused } : {}),
      ...(params.scaling !== undefined ? { scaling: params.scaling } : {}),
      ...(params.expansionPlanNote !== undefined ? { expansionPlanNote: params.expansionPlanNote } : {}),
      updatedByUserId: params.actorUserId,
    },
  });

  await recordAuditEvent({
    actorUserId: params.actorUserId,
    action: "TERRITORY_WAR_ROOM_STATE",
    payload: {
      territoryId: params.territoryId,
      phaseOverride: params.phaseOverride ?? null,
      paused: params.paused ?? null,
      scaling: params.scaling ?? null,
    },
  });
}

export function buildTerritoryWarRoomMobileSummary(payload: NonNullable<Awaited<ReturnType<typeof buildTerritoryWarRoomPayload>>>) {
  return {
    generatedAt: payload.generatedAt,
    territoryId: payload.territoryId,
    territoryName: payload.territoryName,
    header: payload.header,
    leadsGenerated: payload.coreMetrics.leadsGenerated,
    engagementIndex: payload.marketing.engagementIndex,
    blockers: payload.blockers.slice(0, 8),
    nextActions: payload.nextActions.slice(0, 6),
    disclaimers: payload.disclaimers,
  };
}
