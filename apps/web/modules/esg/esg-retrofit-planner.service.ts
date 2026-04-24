import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { userCanAccessEsgActionCenter, serializeEsgActionRow } from "@/modules/esg/esg-action-center.service";
import { getListingIdsForPortfolioUser } from "@/modules/esg/esg-action-portfolio.service";
import { buildRetrofitScenario } from "./esg-retrofit-scenario.engine";
import {
  buildRetrofitDraftRows,
  inferRetrofitPhase,
  planSummaryForStrategy,
  retrofitImpactBandFromAction,
  type RetrofitDraftRow,
} from "./esg-retrofit-generator";
import { matchFinancingOptions } from "./esg-financing-matcher.service";
import { prioritizeActionsForRetrofit, sortRetrofitRowsWithinPhase } from "./esg-retrofit-prioritizer";
import {
  ESG_RETROFIT_VERSION,
  type InvestorRetrofitAppendix,
  type RetrofitPlannerContext,
  type RetrofitStrategyType,
  type SerializedEsgRetrofitAction,
  type SerializedFinancingOption,
  type SerializedRetrofitPlan,
} from "./esg-retrofit.types";

const TAG = "[esg-retrofit]";
const TAG_PLAN = "[esg-retrofit-plan]";

const STRATEGIES: RetrofitStrategyType[] = [
  "BASELINE",
  "OPTIMIZED",
  "AGGRESSIVE",
  "NET_ZERO_PATH",
];

const COST_ORDER: Record<string, number> = {
  LOW: 0,
  UNKNOWN: 1,
  MEDIUM: 2,
  HIGH: 3,
};

const TIMELINE_ORDER: Array<{ re: RegExp; rank: number; label: string }> = [
  { re: /30D|2-4W|WEEK/i, rank: 0, label: "SHORT" },
  { re: /1-3M|1-2M|2-3M|90D/i, rank: 1, label: "MEDIUM" },
  { re: /3-12M|3-6M|6-9M|6-12M/i, rank: 2, label: "LONG" },
  { re: /12M|1-2Y|2Y|3Y|5Y|7Y|Y\+/i, rank: 3, label: "EXTENDED" },
];

function maxCostBand(bands: (string | null | undefined)[]): string | null {
  const clean = bands.filter((b): b is string => Boolean(b));
  if (clean.length === 0) return "UNKNOWN";
  return clean.reduce((a, b) => (COST_ORDER[a] ?? 1) >= (COST_ORDER[b] ?? 1) ? a : b);
}

function maxTimelineLabel(bands: (string | null | undefined)[]): string | null {
  const clean = bands.filter((b): b is string => Boolean(b));
  if (clean.length === 0) return "MEDIUM (typical planning band)";
  let best = 0;
  for (const t of clean) {
    for (const { re, rank } of TIMELINE_ORDER) {
      if (re.test(t) && rank >= best) best = rank;
    }
  }
  return (TIMELINE_ORDER.find((x) => x.rank === best)?.label ?? "MEDIUM") + " (indicative)";
}

function impactPlanBand(rows: RetrofitDraftRow[]): string {
  const hasMaterial = rows.some((r) => (r.impactBand ?? "").includes("MATERIAL"));
  const hasMod = rows.some((r) => (r.impactBand ?? "").includes("MODERATE"));
  if (hasMaterial) return "MATERIAL (directional range)";
  if (hasMod) return "MODERATE (directional range)";
  return "INCREMENTAL (directional range)";
}

function scorePlanBand(ctx: RetrofitPlannerContext, rows: RetrofitDraftRow[]): string {
  if (rows.length === 0) return "N/A";
  return (ctx.grade ? `Grade ${ctx.grade} → next band possible` : "Next grade band may be reachable") + " (advisory only).";
}

function carbonPlanBand(rows: RetrofitDraftRow[]): string {
  const deep = rows.some((r) => r.phase >= 4);
  return deep ?
      "Larger operational carbon reduction possible if measures are installed and metered — wide band."
    : "Incremental to moderate carbon story until deeper measures are in plan scope.";
}

function confidencePlanBand(ctx: RetrofitPlannerContext, rows: RetrofitDraftRow[]): string {
  const hasData = rows.some((r) => r.category === "DATA" || r.category === "DISCLOSURE");
  if (hasData) return "Evidence confidence can move up a step with completed disclosure actions (qualitative).";
  return "Confidence uplift depends on new evidence — current profile: " + String(ctx.evidenceConfidence ?? 0) + "/100 (indicative).";
}

export async function buildPlannerContext(listingId: string): Promise<RetrofitPlannerContext> {
  const profile = await prisma.esgProfile.findUnique({ where: { listingId } });
  const acquisitionReadiness: RetrofitPlannerContext["acquisitionReadinessBand"] =
    !profile ? "UNKNOWN"
    : (profile.compositeScore ?? 0) >= 55 && (profile.dataCoveragePercent ?? 0) >= 35 && (profile.evidenceConfidence ?? 0) >= 35 ?
      "PASS_LIKELY"
    : "CONDITIONAL";

  return {
    listingId,
    compositeScore: profile?.compositeScore ?? null,
    grade: profile?.grade ?? null,
    dataCoveragePercent: profile?.dataCoveragePercent ?? null,
    evidenceConfidence: profile?.evidenceConfidence ?? null,
    acquisitionReadinessBand: acquisitionReadiness,
    solarDeclared: profile?.solar ?? false,
    renovationDeclared: profile?.renovation ?? false,
  };
}

function serializeAction(r: {
  id: string;
  planId: string;
  actionId: string | null;
  title: string;
  category: string;
  phase: number;
  costBand: string | null;
  impactBand: string | null;
  timelineBand: string | null;
  paybackBand: string | null;
  dependenciesJson: unknown;
  notes: string | null;
  createdAt: Date;
}): SerializedEsgRetrofitAction {
  return {
    id: r.id,
    planId: r.planId,
    actionId: r.actionId,
    title: r.title,
    category: r.category,
    phase: r.phase,
    costBand: r.costBand,
    impactBand: r.impactBand,
    timelineBand: r.timelineBand,
    paybackBand: r.paybackBand,
    dependenciesJson: r.dependenciesJson,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
  };
}

function serializeFin(o: {
  id: string;
  listingId: string | null;
  planId: string | null;
  financingType: string;
  name: string;
  provider: string | null;
  eligibilityCriteria: string | null;
  applicableActionsJson: unknown;
  costCoverageBand: string | null;
  benefitType: string;
  priority: string | null;
  notes: string | null;
  reasoning: string | null;
  createdAt: Date;
}): SerializedFinancingOption {
  return {
    id: o.id,
    listingId: o.listingId,
    planId: o.planId,
    financingType: o.financingType,
    name: o.name,
    provider: o.provider,
    eligibilityCriteria: o.eligibilityCriteria,
    applicableActionsJson: o.applicableActionsJson,
    costCoverageBand: o.costCoverageBand,
    benefitType: o.benefitType,
    priority: o.priority,
    notes: o.notes,
    reasoning: o.reasoning,
    createdAt: o.createdAt.toISOString(),
  };
}

function serializePlan(p: {
  id: string;
  listingId: string;
  planName: string;
  strategyType: string;
  summaryText: string | null;
  totalEstimatedCostBand: string | null;
  totalEstimatedImpactBand: string | null;
  totalTimelineBand: string | null;
  expectedScoreBand: string | null;
  expectedCarbonReductionBand: string | null;
  expectedConfidenceImprovement: string | null;
  assumptionsJson: unknown;
  planVersion: string | null;
  createdAt: Date;
  updatedAt: Date;
  retrofitActions: Array<Parameters<typeof serializeAction>[0]>;
  financingOptions: Array<Parameters<typeof serializeFin>[0]>;
}): SerializedRetrofitPlan {
  return {
    id: p.id,
    listingId: p.listingId,
    planName: p.planName,
    strategyType: p.strategyType as RetrofitStrategyType,
    summaryText: p.summaryText,
    totalEstimatedCostBand: p.totalEstimatedCostBand,
    totalEstimatedImpactBand: p.totalEstimatedImpactBand,
    totalTimelineBand: p.totalTimelineBand,
    expectedScoreBand: p.expectedScoreBand,
    expectedCarbonReductionBand: p.expectedCarbonReductionBand,
    expectedConfidenceImprovement: p.expectedConfidenceImprovement,
    assumptionsJson: p.assumptionsJson,
    planVersion: p.planVersion,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    retrofitActions: p.retrofitActions.map(serializeAction),
    financingOptions: p.financingOptions.map(serializeFin),
  };
}

/** Regenerate retrofit plans for a listing (deterministic bands; persists one row per strategy). */
export async function generateRetrofitPlansForListing(
  listingId: string,
  strategies?: RetrofitStrategyType[]
): Promise<{ generated: number; skippedEmpty: number }> {
  const ctx = await buildPlannerContext(listingId);
  const rawActions = await prisma.esgAction.findMany({ where: { listingId } });
  const actions = rawActions.map(serializeEsgActionRow);

  const want = strategies?.length ? strategies : STRATEGIES;
  let generated = 0;
  let skippedEmpty = 0;

  for (const strategy of want) {
    const draft = buildRetrofitDraftRows(actions, ctx, strategy);
    if (draft.length === 0) {
      skippedEmpty += 1;
      logInfo(`${TAG_PLAN} skip-empty`, { listingId, strategy });
      continue;
    }

    const prioritizedSources = prioritizeActionsForRetrofit(actions, ctx);
    const orderIndex = new Map(prioritizedSources.map((a, i) => [a.id, i]));
    const sortedDraft = [...draft].sort((a, b) => {
      const ia = a.actionId ? orderIndex.get(a.actionId) ?? 999 : 999;
      const ib = b.actionId ? orderIndex.get(b.actionId) ?? 999 : 999;
      if (ia !== ib) return ia - ib;
      return a.title.localeCompare(b.title);
    });

    const phased = sortRetrofitRowsWithinPhase(sortedDraft);

    const matched = matchFinancingOptions(listingId, ctx, actions, phased);

    const assumptions = [
      `Planner version ${ESG_RETROFIT_VERSION}; bands are qualitative.`,
      `Acquisition readiness (screening-style): ${ctx.acquisitionReadinessBand}.`,
      `Strategies exclude numeric ROI — directional ranges only.`,
    ];

    await prisma.esgRetrofitPlan.deleteMany({ where: { listingId, strategyType: strategy } });

    const meta = planSummaryForStrategy(strategy);
    await prisma.esgRetrofitPlan.create({
      data: {
        listingId,
        planName: meta.name,
        strategyType: strategy,
        summaryText: meta.summary,
        totalEstimatedCostBand: maxCostBand(phased.map((r) => r.costBand)),
        totalEstimatedImpactBand: impactPlanBand(phased),
        totalTimelineBand: maxTimelineLabel(phased.map((r) => r.timelineBand)),
        expectedScoreBand: scorePlanBand(ctx, phased),
        expectedCarbonReductionBand: carbonPlanBand(phased),
        expectedConfidenceImprovement: confidencePlanBand(ctx, phased),
        assumptionsJson: assumptions as object,
        planVersion: ESG_RETROFIT_VERSION,
        retrofitActions: {
          create: phased.map((r) => ({
            actionId: r.actionId,
            title: r.title.slice(0, 256),
            category: r.category,
            phase: r.phase,
            costBand: r.costBand,
            impactBand: r.impactBand,
            timelineBand: r.timelineBand,
            paybackBand: r.paybackBand,
            dependenciesJson: r.dependenciesJson ?? undefined,
            notes: r.notes,
          })),
        },
        financingOptions: {
          create: matched.map((m) => ({
            listingId,
            financingType: m.type,
            name: m.name,
            provider: null,
            eligibilityCriteria: m.reasoning.slice(0, 2000),
            applicableActionsJson: phased.slice(0, 12).map((r) => r.title) as object,
            costCoverageBand: m.coverageBand,
            benefitType: m.benefit,
            priority: m.priority,
            notes: `Applicability: ${m.applicability}`,
            reasoning: m.reasoning,
          })),
        },
      },
    });

    generated += 1;
    logInfo(`${TAG_PLAN} saved`, { listingId, strategy, rows: phased.length });
  }

  logInfo(`${TAG} generate-done`, { listingId, generated, skippedEmpty });

  // Trigger underwriting refresh for all linked deals (non-blocking)
  prisma.investmentPipelineDeal.findMany({
    where: { listingId },
    select: { id: true }
  }).then(deals => {
    for (const d of deals) {
      import("@/modules/investment-ai/deal-underwriting.integration.service")
        .then(m => m.runAndAttachUnderwritingToDeal(d.id, { source: "ARTIFACTS_REFRESH" }))
        .catch(() => {});
    }
  }).catch(() => {});

  return { generated, skippedEmpty };
}

export async function getRetrofitPlansForListing(listingId: string): Promise<SerializedRetrofitPlan[]> {
  const rows = await prisma.esgRetrofitPlan.findMany({
    where: { listingId },
    include: {
      retrofitActions: { orderBy: [{ phase: "asc" }, { title: "asc" }] },
      financingOptions: true,
    },
    orderBy: [{ strategyType: "asc" }],
  });
  return rows.map((p) =>
    serializePlan({
      ...p,
      retrofitActions: p.retrofitActions,
      financingOptions: p.financingOptions,
    })
  );
}

export async function ensureRetrofitAccess(userId: string, listingId: string): Promise<boolean> {
  return userCanAccessEsgActionCenter(userId, listingId);
}

export type PortfolioRetrofitRow = {
  listingId: string;
  listingTitle: string | null;
  listingCode: string | null;
  strategyType: RetrofitStrategyType | null;
  totalEstimatedCostBand: string | null;
  totalEstimatedImpactBand: string | null;
  totalTimelineBand: string | null;
  updatedAt: string | null;
  openActions: number;
};

/** Aggregate portfolio retrofit signals — conservative ranking heuristics. */
export async function getRetrofitPortfolioSummary(userId: string, role: PlatformRole | null | undefined) {
  const ids = await getListingIdsForPortfolioUser(userId, role);
  if (ids.length === 0) {
    return {
      listings: [] as PortfolioRetrofitRow[],
      topRetrofitCandidates: [] as PortfolioRetrofitRow[],
      carbonOpportunities: [] as PortfolioRetrofitRow[],
      financingFriendly: [] as PortfolioRetrofitRow[],
    };
  }

  const listings = await prisma.listing.findMany({
    where: { id: { in: ids } },
    select: { id: true, title: true, listingCode: true },
  });

  const plans = await prisma.esgRetrofitPlan.findMany({
    where: { listingId: { in: ids }, strategyType: "OPTIMIZED" },
    include: {
      retrofitActions: { select: { phase: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const actionsPerListing = await prisma.esgAction.groupBy({
    by: ["listingId"],
    where: {
      listingId: { in: ids },
      status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] },
    },
    _count: true,
  });
  const actionCount = new Map(actionsPerListing.map((g) => [g.listingId, g._count]));

  const latestPlanByListing = new Map<string, (typeof plans)[0]>();
  for (const p of plans) {
    if (!latestPlanByListing.has(p.listingId)) latestPlanByListing.set(p.listingId, p);
  }

  const rows: PortfolioRetrofitRow[] = listings.map((l) => {
    const pl = latestPlanByListing.get(l.id);
    return {
      listingId: l.id,
      listingTitle: l.title,
      listingCode: l.listingCode,
      strategyType: (pl?.strategyType as RetrofitStrategyType) ?? null,
      totalEstimatedCostBand: pl?.totalEstimatedCostBand ?? null,
      totalEstimatedImpactBand: pl?.totalEstimatedImpactBand ?? null,
      totalTimelineBand: pl?.totalTimelineBand ?? null,
      updatedAt: pl?.updatedAt?.toISOString() ?? null,
      openActions: actionCount.get(l.id) ?? 0,
    };
  });

  const materialImpact = [...rows].sort((a, b) => {
    const ai = (a.totalEstimatedImpactBand ?? "").includes("MATERIAL") ? 1 : 0;
    const bi = (b.totalEstimatedImpactBand ?? "").includes("MATERIAL") ? 1 : 0;
    return bi - ai;
  });

  const carbonOpps = [...rows].filter((r) => r.openActions >= 3).sort((a, b) => b.openActions - a.openActions);

  const financingFriendly = [...rows]
    .filter((r) => r.updatedAt && r.totalEstimatedImpactBand !== null)
    .slice(0, 12);

  return {
    listings: rows,
    topRetrofitCandidates: materialImpact.slice(0, 12),
    carbonOpportunities: carbonOpps.slice(0, 12),
    financingFriendly: financingFriendly.slice(0, 12),
  };
}

export async function createRetrofitScenarioRecord(args: {
  listingId: string;
  scenarioName: string;
  selectedEsgActionIds: string[];
  planStrategy?: RetrofitStrategyType;
}) {
  const ctx = await buildPlannerContext(args.listingId);
  const plan = await prisma.esgRetrofitPlan.findFirst({
    where: {
      listingId: args.listingId,
      strategyType: args.planStrategy ?? "OPTIMIZED",
    },
    include: { retrofitActions: true },
    orderBy: { updatedAt: "desc" },
  });

  const actions = await prisma.esgAction.findMany({ where: { listingId: args.listingId } });
  const serialized = actions.map(serializeEsgActionRow);

  let draftRows: RetrofitDraftRow[] = [];
  if (plan) {
    const pick = new Set(args.selectedEsgActionIds);
    draftRows = plan.retrofitActions
      .filter((r) => r.actionId && pick.has(r.actionId))
      .map((r) => ({
        actionId: r.actionId,
        title: r.title,
        category: r.category,
        phase: r.phase as RetrofitDraftRow["phase"],
        costBand: r.costBand,
        impactBand: r.impactBand,
        timelineBand: r.timelineBand,
        paybackBand: r.paybackBand,
        dependenciesJson: (r.dependenciesJson as Record<string, unknown> | null) ?? null,
        notes: r.notes,
      }));
  }

  if (draftRows.length === 0 && args.selectedEsgActionIds.length > 0) {
    const pick = new Set(args.selectedEsgActionIds);
    const subset = serialized.filter((a) => pick.has(a.id));
    draftRows = subset.map((a) => ({
      actionId: a.id,
      title: a.title,
      category: a.category,
      phase: inferRetrofitPhase(a),
      costBand: a.estimatedCostBand,
      impactBand: retrofitImpactBandFromAction(a),
      timelineBand: a.estimatedTimelineBand,
      paybackBand: a.paybackBand,
      dependenciesJson: null,
      notes:
        "Derived from Action Center selection — retrofit plan rows were unavailable for these ids; phases inferred deterministically.",
    }));
  }

  if (draftRows.length === 0) {
    throw new Error("NO_ACTIONS_FOR_SCENARIO");
  }

  const scenario = buildRetrofitScenario(draftRows, ctx, serialized, args.scenarioName);

  const row = await prisma.esgRetrofitScenario.create({
    data: {
      listingId: args.listingId,
      scenarioName: args.scenarioName.slice(0, 128),
      selectedActionsJson: args.selectedEsgActionIds as object,
      totalCostBand: scenario.totalCostBand,
      totalImpactBand: scenario.totalImpactBand,
      timelineBand: scenario.timelineBand,
      expectedScoreBand: scenario.expectedScoreBand,
      expectedCarbonBand: scenario.expectedCarbonReductionBand,
      financingFit: scenario.financingFit,
      assumptionsJson: [
        ...(scenario.directionalRoiBand ?
          [`Directional payback / ROI posture (bands only): ${scenario.directionalRoiBand}`]
        : []),
        ...scenario.assumptions,
        ...scenario.financingFitNotes,
      ] as object,
      risksJson: scenario.risks as object,
    },
  });

  logInfo("[esg-retrofit-scenario] saved", { listingId: args.listingId, id: row.id });
  return { id: row.id, scenario };
}

export function formatRetrofitForInvestorHtml(appendix: InvestorRetrofitAppendix): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const phaseBlocks = appendix.phasedSummary
    .map((p) => `<p><strong>Phase ${p.phase} — ${esc(p.label)}</strong></p><ul>${p.titles.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`)
    .join("");
  const top = appendix.topActions
    .map((a) => `<li><strong>${esc(a.title)}</strong> (phase ${a.phase}, cost band ${esc(a.costBand ?? "unknown")})</li>`)
    .join("");
  const fin = appendix.financingBullets.map((x) => `<li>${esc(x)}</li>`).join("");
  return `
  <section style="margin-top:1.25rem">
    <h3>Retrofit strategy & financing (advisory bands)</h3>
    <p><em>${esc(appendix.strategySummary)}</em></p>
    <p><strong>Selected plan:</strong> ${esc(appendix.planName ?? "Not selected")} (${esc(appendix.strategyType ?? "—")})</p>
    <p><strong>Aggregated bands (not quotes):</strong> cost ${esc(appendix.costBand ?? "—")}, impact ${esc(appendix.impactBand ?? "—")}, timeline ${esc(appendix.timelineBand ?? "—")}</p>
    <h4>Phased roadmap (summary)</h4>
    ${phaseBlocks || "<p>—</p>"}
    <h4>Top actions</h4>
    <ol>${top || "<li>—</li>"}</ol>
    <h4>Financing mapping (non-binding)</h4>
    <ul>${fin || "<li>Map financing after disclosure baseline improves.</li>"}</ul>
  </section>
  `.trim();
}

export async function buildInvestorRetrofitAppendix(
  listingId: string,
  strategy: RetrofitStrategyType = "OPTIMIZED"
): Promise<InvestorRetrofitAppendix | null> {
  const plan = await prisma.esgRetrofitPlan.findFirst({
    where: { listingId, strategyType: strategy },
    include: { retrofitActions: { orderBy: [{ phase: "asc" }] } },
    orderBy: { updatedAt: "desc" },
  });
  if (!plan || plan.retrofitActions.length === 0) return null;

  const phased: InvestorRetrofitAppendix["phasedSummary"] = [1, 2, 3, 4, 5].map((phase) => {
    const label =
      phase === 1 ? "Data & disclosure"
      : phase === 2 ? "Low-cost improvements"
      : phase === 3 ? "Operational optimization"
      : phase === 4 ? "Capex upgrades"
      : "Strategic transformation";
    const titles = plan.retrofitActions.filter((a) => a.phase === phase).map((a) => a.title);
    return { phase, label, titles };
  }).filter((p) => p.titles.length > 0);

  const topActions = plan.retrofitActions.slice(0, 5).map((a) => ({
    title: a.title,
    phase: a.phase,
    costBand: a.costBand,
  }));

  const financing = await prisma.esgFinancingOption.findMany({
    where: { planId: plan.id },
    take: 8,
  });
  const financingBullets = financing.map(
    (f) => `${f.financingType}: ${f.name} — ${f.reasoning ?? f.notes ?? ""}`.slice(0, 400)
  );

  return {
    planName: plan.planName,
    strategyType: plan.strategyType as RetrofitStrategyType,
    phasedSummary: phased,
    topActions,
    costBand: plan.totalEstimatedCostBand,
    impactBand: plan.totalEstimatedImpactBand,
    timelineBand: plan.totalTimelineBand,
    financingBullets,
    strategySummary:
      plan.summaryText ??
      "Phased retrofit bands support investor sequencing discussions; engineering and incentive diligence still required.",
  };
}

export async function listRetrofitScenariosForListing(listingId: string, take = 25) {
  return prisma.esgRetrofitScenario.findMany({
    where: { listingId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      scenarioName: true,
      totalCostBand: true,
      totalImpactBand: true,
      timelineBand: true,
      expectedScoreBand: true,
      expectedCarbonBand: true,
      financingFit: true,
      createdAt: true,
    },
  });
}

export async function refreshRetrofitAfterActionCenterUpdate(listingId: string) {
  try {
    await generateRetrofitPlansForListing(listingId);
  } catch (e) {
    logInfo(`${TAG} refresh-failed`, { listingId, message: String(e) });
  }
}

export { ESG_RETROFIT_VERSION };
