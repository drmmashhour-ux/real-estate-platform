import { prisma } from "@/lib/db";
import { buildSelfExpansionDashboardHints } from "@/modules/self-expansion/self-expansion-integration.service";
import { buildFullAutopilotControlCenterPayload } from "@/modules/autopilot-governance/full-autopilot-control-center.service";
import {
  getDomainMatrixRow,
  listDomainMatrix,
  normalizePersistedMode,
} from "@/modules/autopilot-governance/autopilot-domain-matrix.service";
import type { FullAutopilotMode } from "@/modules/autopilot-governance/autopilot-domain-matrix.types";
import type { LecipmAutopilotDomainId } from "@/modules/autopilot-governance/autopilot-domain-matrix.types";

import {
  AUTONOMY_UI_DOMAIN_GROUPS,
  type AutonomyUiDomainId,
  uiGroupForTechnicalDomain,
} from "./autonomy-command-center.groups";
import {
  deriveRollupAutonomyStatus,
  friendlyAutonomyActionLabel,
  outcomePhrase,
} from "./autonomy-command-center.pure";

type ExecutiveKpis = {
  revenueCentsToday: number | null;
  revenueCentsWeek: number | null;
  revenueCentsMonth: number | null;
  activeDeals: number | null;
  bookingsToday: number | null;
  conversionRate: number | null;
  revenueNote: string | null;
};

function readNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  return null;
}

async function loadExecutiveKpis(): Promise<ExecutiveKpis> {
  try {
    const snapshot = await prisma.executiveSnapshot.findFirst({
      where: { ownerType: "admin", ownerId: "platform" },
      orderBy: { snapshotDate: "desc" },
      select: { financialMetrics: true, platformMetrics: true },
    });
    const fin = (snapshot?.financialMetrics ?? {}) as Record<string, unknown>;
    const plat = (snapshot?.platformMetrics ?? {}) as Record<string, unknown>;

    const revenueCentsToday =
      readNumber(fin.revenueCentsToday) ??
      readNumber(fin.todayRevenueCents) ??
      readNumber(fin.totalRevenueCentsToday);
    const revenueCentsWeek =
      readNumber(fin.revenueCentsWeek) ?? readNumber(fin.weekRevenueCents) ?? readNumber(fin.totalRevenueCentsWeek);
    const revenueCentsMonth =
      readNumber(fin.revenueCentsMonth) ??
      readNumber(fin.monthRevenueCents) ??
      readNumber(fin.totalRevenueCentsMonth);

    const conversionRate =
      readNumber(plat.conversionRate) ??
      readNumber(plat.leadToBookingRate) ??
      readNumber((plat.funnel as Record<string, unknown> | undefined)?.conversionRate);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [activeDeals, bookingsToday] = await Promise.all([
      prisma.deal.count({
        where: { status: { notIn: ["closed", "cancelled"] } },
      }),
      prisma.booking.count({ where: { createdAt: { gte: startOfToday } } }),
    ]);

    return {
      revenueCentsToday,
      revenueCentsWeek,
      revenueCentsMonth,
      activeDeals,
      bookingsToday,
      conversionRate,
      revenueNote:
        revenueCentsToday == null && revenueCentsWeek == null ?
          "Financial KPIs populate when executive snapshots include `financialMetrics`."
        : null,
    };
  } catch {
    return {
      revenueCentsToday: null,
      revenueCentsWeek: null,
      revenueCentsMonth: null,
      activeDeals: null,
      bookingsToday: null,
      conversionRate: null,
      revenueNote: "Executive / booking aggregates unavailable in this environment.",
    };
  }
}

async function loadDealPipelineSignals() {
  try {
    const now = new Date();
    const stalledCutoff = new Date(now);
    stalledCutoff.setDate(stalledCutoff.getDate() - 21);

    const [priority, stalled, hot] = await Promise.all([
      prisma.deal.findMany({
        where: {
          status: { notIn: ["closed", "cancelled"] },
          OR: [{ crmStage: { contains: "offer", mode: "insensitive" } }, { status: "accepted" }],
        },
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: {
          id: true,
          dealCode: true,
          status: true,
          crmStage: true,
          updatedAt: true,
          priceCents: true,
        },
      }),
      prisma.deal.findMany({
        where: {
          status: { notIn: ["closed", "cancelled"] },
          updatedAt: { lt: stalledCutoff },
        },
        orderBy: { updatedAt: "asc" },
        take: 8,
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
        take: 8,
        select: {
          id: true,
          dealCode: true,
          status: true,
          crmStage: true,
          updatedAt: true,
        },
      }),
    ]);

    const riskBuckets = await prisma.deal.groupBy({
      by: ["status"],
      where: { status: { notIn: ["closed", "cancelled"] } },
      _count: true,
    });

    return {
      priorityDeals: priority,
      stalledDeals: stalled,
      highProbabilityDeals: hot,
      riskDistribution: riskBuckets.map((r) => ({ status: r.status, count: r._count })),
    };
  } catch {
    return {
      priorityDeals: [],
      stalledDeals: [],
      highProbabilityDeals: [],
      riskDistribution: [] as Array<{ status: string; count: number }>,
    };
  }
}

async function loadMarketingSignals() {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [campaigns, seoDrafts, engagementProxy] = await Promise.all([
      prisma.marketingCampaign.count({
        where: { updatedAt: { gte: startOfMonth } },
      }).catch(() => null),
      prisma.seoPageDraft.count().catch(() => null),
      prisma.bnhubGrowthCampaign.count().catch(() => null),
    ]);

    return {
      contentCalendarNote: "Calendar rows are sourced from campaign + BNHub growth tables (admin view).",
      campaignsRunning: campaigns,
      seoPagesGenerated: seoDrafts,
      cityLaunchStatus: [] as Array<{ city: string; state: string }>,
      engagementMetrics: {
        campaignsIndexed: engagementProxy,
        advisory: "Engagement is a coarse index — refine with channel attribution tables.",
      },
    };
  } catch {
    return {
      contentCalendarNote: "Marketing aggregates unavailable.",
      campaignsRunning: null,
      seoPagesGenerated: null,
      cityLaunchStatus: [],
      engagementMetrics: { campaignsIndexed: null, advisory: null },
    };
  }
}

function aggregateExecutionsByUiGroup(
  rows: Array<{ domain: string; decisionOutcome: string }>
): Map<
  AutonomyUiDomainId,
  { total: number; automatic: number; blocked: number; needApproval: number }
> {
  const map = new Map<
    AutonomyUiDomainId,
    { total: number; automatic: number; blocked: number; needApproval: number }
  >();
  for (const g of AUTONOMY_UI_DOMAIN_GROUPS) {
    map.set(g.id, { total: 0, automatic: 0, blocked: 0, needApproval: 0 });
  }
  for (const r of rows) {
    const gid = uiGroupForTechnicalDomain(r.domain);
    if (!gid) continue;
    const cell = map.get(gid)!;
    cell.total += 1;
    if (r.decisionOutcome === "ALLOW_AUTOMATIC") cell.automatic += 1;
    else if (r.decisionOutcome === "BLOCK") cell.blocked += 1;
    else if (r.decisionOutcome === "REQUIRE_APPROVAL") cell.needApproval += 1;
  }
  return map;
}

export async function buildAutonomyCommandCenterPayload() {
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const [
    core,
    kpis,
    pipeline,
    marketing,
    execRollup,
    recentExecs,
    complianceDealFlags,
  ] = await Promise.all([
    buildFullAutopilotControlCenterPayload(),
    loadExecutiveKpis(),
    loadDealPipelineSignals(),
    loadMarketingSignals(),
    prisma.lecipmFullAutopilotExecution
      .findMany({
        where: { createdAt: { gte: since } },
        select: { domain: true, decisionOutcome: true },
      })
      .catch(() => [] as Array<{ domain: string; decisionOutcome: string }>),
    prisma.lecipmFullAutopilotExecution
      .findMany({
        orderBy: { createdAt: "desc" },
        take: 60,
        select: {
          id: true,
          domain: true,
          actionType: true,
          decisionOutcome: true,
          explanation: true,
          createdAt: true,
          platformActionId: true,
        },
      })
      .catch(() => []),
    prisma.deal
      .count({
        where: {
          OR: [{ possibleBypassFlag: true }, { commissionEligible: true }],
        },
      })
      .catch(() => null),
  ]);

  const aggByUi = aggregateExecutionsByUiGroup(execRollup);

  const cfgByDomain = new Map(
    (await prisma.lecipmFullAutopilotDomainConfig.findMany()).map((c) => [c.domainId, c])
  );

  const matrixRows = listDomainMatrix();
  const effectiveModes: FullAutopilotMode[] = matrixRows.map((m) => {
    const row = cfgByDomain.get(m.domain);
    return normalizePersistedMode(row?.mode ?? m.defaultMode);
  });

  const killOff = matrixRows.filter((m) => {
    const row = cfgByDomain.get(m.domain);
    return (row?.killSwitch ?? "ON") === "OFF";
  }).length;

  const rollupStatus = deriveRollupAutonomyStatus({
    globalPaused: core.globalPause.paused,
    effectiveModes,
    killSwitchOffFraction: killOff / Math.max(matrixRows.length, 1),
  });

  const highRiskAlerts = core.alerts.filter((a) => a.severity === "HIGH" || a.severity === "CRITICAL").length;

  const conversionDisplay =
    kpis.conversionRate ??
    (core.outcomeMetrics.totalExecutions > 0 ?
      core.outcomeMetrics.allowCount / Math.max(core.outcomeMetrics.totalExecutions, 1)
    : null);

  const liveAutonomyFeed = recentExecs.slice(0, 40).map((r) => {
    const ui = uiGroupForTechnicalDomain(r.domain);
    const groupTitle = AUTONOMY_UI_DOMAIN_GROUPS.find((g) => g.id === ui)?.title ?? r.domain;
    return {
      id: `exec:${r.id}`,
      domain: r.domain,
      domainLabel: groupTitle,
      action: friendlyAutonomyActionLabel(r.actionType),
      result: outcomePhrase(r.decisionOutcome),
      timestamp: r.createdAt.toISOString(),
      explanationPreview: r.explanation.slice(0, 240),
      drilldownHref: `/dashboard/admin/autonomy-command-center/${r.id}`,
    };
  });

  const domainMatrixUi = AUTONOMY_UI_DOMAIN_GROUPS.map((g) => {
    const modes: FullAutopilotMode[] = [];
    const risks: string[] = [];
    let killAgg: "ON" | "OFF" | "LIMITED" | "MIXED" = "ON";
    let fullAllowed = false;

    for (const d of g.domainIds) {
      const row = cfgByDomain.get(d);
      const def = getDomainMatrixRow(d);
      const mode = normalizePersistedMode(row?.mode ?? def?.defaultMode ?? "ASSIST");
      modes.push(mode);
      risks.push(def?.riskLevel ?? "MEDIUM");
      const mr = getDomainMatrixRow(d);
      if (mr?.allowedModes.includes("FULL_AUTOPILOT_BOUNDED")) fullAllowed = true;
    }

    const ks = g.domainIds.map((d) => cfgByDomain.get(d)?.killSwitch ?? "ON");
    if (ks.every((k) => k === "ON")) killAgg = "ON";
    else if (ks.every((k) => k === "OFF")) killAgg = "OFF";
    else killAgg = "MIXED";

    const uniqModes = [...new Set(modes)];
    const modeLabel =
      uniqModes.length === 1 ? uniqModes[0] : `Mixed (${uniqModes.slice(0, 3).join(", ")})`;

    const stats = aggByUi.get(g.id)!;
    const successRate =
      stats.total === 0 ? null : (stats.automatic + stats.needApproval) / stats.total;

    const worstRisk =
      risks.includes("CRITICAL") ? "CRITICAL"
      : risks.includes("HIGH") ? "HIGH"
      : risks.includes("MEDIUM") ? "MEDIUM"
      : "LOW";

    return {
      uiDomainId: g.id,
      title: g.title,
      technicalDomains: [...g.domainIds],
      modeLabel,
      modesUnderlying: modes,
      riskLevel: worstRisk,
      successRate,
      killSwitchAggregate: killAgg,
      fullAutopilotBoundedEligible: fullAllowed,
    };
  });

  const performanceByDomain = AUTONOMY_UI_DOMAIN_GROUPS.map((g) => {
    const agg = aggByUi.get(g.id)!;
    const approvals = core.approvals.filter((a) => g.domainIds.includes(a.domain as LecipmAutopilotDomainId));
    const pending = approvals.filter((a) => a.status === "PENDING").length;
    const decided = approvals.filter((a) => a.status === "APPROVED" || a.status === "REJECTED").length;
    const approvalRatio =
      pending + decided === 0 ? null : decided / Math.max(pending + decided, 1);

    const roiBand =
      agg.total === 0 ? "thin"
      : agg.blocked / agg.total > 0.25 ? "elevated_risk"
      : "healthy";

    return {
      uiDomainId: g.id,
      title: g.title,
      actionsExecuted: agg.total,
      successRate: agg.total === 0 ? null : (agg.automatic + agg.needApproval) / agg.total,
      failureRate: agg.total === 0 ? null : agg.blocked / agg.total,
      approvalRatio,
      roiImpactBand: roiBand as "thin" | "healthy" | "elevated_risk",
      timeSavedMinutes:
        (core.measurementNotes.operatorWidgets?.estimatedMinutesSaved7d ?? 0) /
        Math.max(AUTONOMY_UI_DOMAIN_GROUPS.length, 1),
    };
  });

  const riskCompliance = {
    blockedActions: core.liveFeed.blocked.length,
    complianceAlerts: core.alerts.filter((a) => a.title.toLowerCase().includes("compliance")).length,
    insuranceCoownershipReviewFlags: complianceDealFlags,
    fraudSignals: core.failures.topBlockedReasons.slice(0, 6),
    policyViolations: core.liveFeed.blocked.slice(0, 12),
  };

  const anomalies = [
    ...core.alerts.map((a) => ({
      kind: "alert" as const,
      severity: a.severity,
      title: a.title,
      detail: a.detail,
    })),
    ...core.failures.topBlockedReasons.slice(0, 5).map((t) => ({
      kind: "blocked_pattern" as const,
      severity: "MEDIUM" as const,
      title: `Repeated block: ${t.key}`,
      detail: `${t.count} occurrences (7d window).`,
    })),
  ];

  const selfExpansionHints = await buildSelfExpansionDashboardHints();

  return {
    generatedAt: new Date().toISOString(),
    advisory: core.advisory,
    selfExpansionHints,
    core,
    systemOverview: {
      revenueCentsToday: kpis.revenueCentsToday,
      revenueCentsWeek: kpis.revenueCentsWeek,
      revenueCentsMonth: kpis.revenueCentsMonth,
      activeDeals: kpis.activeDeals,
      bookingsToday: kpis.bookingsToday,
      conversionRate: conversionDisplay,
      autonomyStatus: rollupStatus,
      highRiskAlertsCount: highRiskAlerts,
      revenueNote: kpis.revenueNote,
      globalPaused: core.globalPause.paused,
    },
    liveAutonomyFeed,
    domainMatrix: domainMatrixUi,
    revenueGrowth: {
      revenueTrendNote:
        "Trends blend executive financial snapshots with booking throughput — interpret as directional signals.",
      bookingsTrend: kpis.bookingsToday,
      conversionTrend: conversionDisplay,
      roiSignalsBand: core.measurementNotes.roiSnapshot,
      topChannelsNote: "Channel ROI requires attribution linkage — surfaced when marketing warehouse is populated.",
      capitalAllocationImpact: core.measurementNotes.roiSnapshot,
    },
    dealIntelligence: pipeline,
    marketingExpansion: marketing,
    riskCompliance,
    approvalQueue: core.approvals,
    alertsAndAnomalies: anomalies,
    performanceByDomain,
    controlsHint: {
      pause: "POST /api/autonomy-command-center/pause",
      quickMode: "POST /api/autonomy-command-center/quick-mode",
      emergency: "POST /api/autonomy-command-center/emergency-kill",
      recompute: "POST /api/autonomy-command-center/recompute",
      learningReset: "POST /api/autonomy-command-center/learning-reset (audit only)",
    },
  };
}

export type AutonomyCommandCenterPayload = Awaited<ReturnType<typeof buildAutonomyCommandCenterPayload>>;
