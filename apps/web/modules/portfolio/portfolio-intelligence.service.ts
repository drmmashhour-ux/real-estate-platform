import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { allocatePortfolioCapitalBands } from "./portfolio-capital-allocator";
import {
  computePortfolioHealth,
  effectiveConfidenceLabel,
  deriveConfidence,
} from "./portfolio-health.engine";
import {
  assertAssetAccessible,
  loadContextsForAssets,
  listAccessibleAssetIds,
  loadPortfolioAssetContext,
} from "./portfolio-access";
import { buildPortfolioPriorities, pickWatchlistFromHealth } from "./portfolio-prioritizer";
import { runPortfolioOptimization } from "./portfolio-optimization.engine";
import type { ObjectiveMode, PortfolioHealthResult, PortfolioIntelligenceBundle } from "./portfolio.types";
import { portfolioLog } from "./portfolio-log";
import { selectAssetStrategy } from "./asset-manager.service";
import { buildAssetManagerActions } from "./asset-manager-action.engine";

export async function getOrCreatePortfolioPolicy(ownerId: string) {
  return prisma.portfolioPolicy.upsert({
    where: { ownerId },
    create: { ownerId },
    update: {},
  });
}

async function persistAssetHealth(assetId: string, health: PortfolioHealthResult, ctx: import("./portfolio-access").PortfolioAssetContext) {
  const confidence = effectiveConfidenceLabel(deriveConfidence(ctx), ctx);
  await prisma.portfolioAssetHealth.upsert({
    where: { assetId },
    create: {
      assetId,
      overallHealthScore: health.overallHealthScore,
      healthBand: health.healthBand,
      revenueHealthScore: health.subscores.revenue.score,
      esgHealthScore: health.subscores.esg.score,
      complianceHealthScore: health.subscores.compliance.score,
      financingHealthScore: health.subscores.financing.score,
      operationsHealthScore: health.subscores.operations.score,
      confidenceLevel: confidence,
      blockersJson: health.blockers as unknown as object[],
      opportunitiesJson: health.opportunities as unknown as object[],
      summaryText: health.explanation.slice(0, 8000),
    },
    update: {
      overallHealthScore: health.overallHealthScore,
      healthBand: health.healthBand,
      revenueHealthScore: health.subscores.revenue.score,
      esgHealthScore: health.subscores.esg.score,
      complianceHealthScore: health.subscores.compliance.score,
      financingHealthScore: health.subscores.financing.score,
      operationsHealthScore: health.subscores.operations.score,
      confidenceLevel: confidence,
      blockersJson: health.blockers as unknown as object[],
      opportunitiesJson: health.opportunities as unknown as object[],
      summaryText: health.explanation.slice(0, 8000),
    },
  });
}

function averageBand(healthMap: Map<string, PortfolioHealthResult>): PortfolioIntelligenceBundle["overview"]["averageHealthBand"] {
  if (healthMap.size === 0) return "UNKNOWN";
  const order = ["CRITICAL", "AT_RISK", "WATCHLIST", "STABLE", "STRONG"];
  const scores = [...healthMap.values()].map((h) => order.indexOf(h.healthBand));
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const idx = Math.round(avg);
  return (order[idx] ?? "WATCHLIST") as PortfolioIntelligenceBundle["overview"]["averageHealthBand"];
}

export async function buildPortfolioIntelligence(userId: string, role: PlatformRole): Promise<PortfolioIntelligenceBundle> {
  portfolioLog.health("recompute_bundle_start", { userId });
  const assetIds = await listAccessibleAssetIds(userId, role);
  const contexts = await loadContextsForAssets(assetIds);
  const policy = await getOrCreatePortfolioPolicy(userId);

  const healthByAsset = new Map<string, PortfolioHealthResult>();
  for (const id of assetIds) {
    const ctx = contexts.get(id);
    if (!ctx) continue;
    const h = computePortfolioHealth(ctx);
    healthByAsset.set(id, h);
    await persistAssetHealth(id, h, ctx).catch(() => undefined);
  }

  const priorities = buildPortfolioPriorities(contexts, healthByAsset, policy);
  const capitalAllocation = allocatePortfolioCapitalBands({
    contexts,
    healthByAsset,
    priorities,
    policy,
  });

  const watchlist = pickWatchlistFromHealth(healthByAsset).map((w) => ({
    assetId: w.assetId,
    assetName: contexts.get(w.assetId)?.assetName,
    healthBand: w.healthBand,
    reason: w.reason,
  }));

  const opt = runPortfolioOptimization({
    objectiveMode: "BALANCED",
    contexts,
    healthByAsset,
    policy,
  });

  const criticalCount = [...healthByAsset.values()].filter((h) => h.healthBand === "CRITICAL").length;
  const watchlistCount = watchlist.length;
  const quickWinsCount = priorities.filter((p) => p.priorityType === "QUICK_WIN").length;

  portfolioLog.health("recompute_bundle_done", { assets: assetIds.length });

  return {
    overview: {
      totalAssets: assetIds.length,
      averageHealthBand: averageBand(healthByAsset),
      criticalCount,
      watchlistCount,
      quickWinsCount,
      capitalNeedSummary:
        criticalCount > 0
          ? `${criticalCount} asset(s) in CRITICAL band — urgent fixes likely before discretionary capex.`
          : "No critical-band assets detected in current slice — deploy capital toward watchlist + quick wins.",
      policyMode: policy.autonomyMode as PortfolioIntelligenceBundle["overview"]["policyMode"],
    },
    priorities,
    capitalAllocation,
    watchlist,
    commonThemes: opt.commonActionThemes,
  };
}

export async function runOptimizationAndPersist(input: {
  userId: string;
  role: PlatformRole;
  objectiveMode: ObjectiveMode;
}) {
  const { userId, role, objectiveMode } = input;
  portfolioLog.optimize("run_start", { objectiveMode });

  const assetIds = await listAccessibleAssetIds(userId, role);
  const contexts = await loadContextsForAssets(assetIds);
  const policy = await getOrCreatePortfolioPolicy(userId);

  const healthByAsset = new Map<string, PortfolioHealthResult>();
  for (const id of assetIds) {
    const ctx = contexts.get(id);
    if (!ctx) continue;
    healthByAsset.set(id, computePortfolioHealth(ctx));
  }

  const result = runPortfolioOptimization({ objectiveMode, contexts, healthByAsset, policy });

  const run = await prisma.lecipmPortfolioOptimizationRun.create({
    data: {
      ownerId: userId,
      objectiveMode,
      summaryJson: {
        executiveSummary: result.executiveSummary,
        watchlistAssets: result.watchlistAssets,
        commonActionThemes: result.commonActionThemes,
      } as object,
      assetStrategiesJson: result.topPriorityAssets as unknown as object,
      allocationProposalJson: result.recommendedCapitalAllocation as unknown as object,
    },
  });

  /** Replace portfolio priorities snapshot for accessible assets */
  await prisma.portfolioPriority.deleteMany({ where: { assetId: { in: assetIds } } });
  const rows = buildPortfolioPriorities(contexts, healthByAsset, policy).map((p) => ({
    assetId: p.assetId,
    priorityType: p.priorityType,
    rank: p.rank,
    priorityScore: p.priorityScore,
    title: p.title,
    explanation: p.explanation,
    actionJson: (p.actionHint ?? {}) as object,
  }));
  if (rows.length) await prisma.portfolioPriority.createMany({ data: rows });

  await prisma.portfolioCapitalAllocationPlan.create({
    data: {
      ownerId: userId,
      version: `opt-${run.id.slice(0, 8)}`,
      status: "PROPOSED",
      totalBudgetBand: "AGGREGATE_BANDS_ONLY",
      allocationJson: result.recommendedCapitalAllocation.allocationSummary as unknown as object,
      rationaleJson: {
        rationale: result.recommendedCapitalAllocation.rationale,
        disclosure: result.recommendedCapitalAllocation.disclosure,
      } as object,
    },
  });

  portfolioLog.optimize("run_complete", { runId: run.id });

  return {
    runId: run.id,
    summary: result.executiveSummary,
    assetStrategies: result.topPriorityAssets,
    allocationProposal: result.recommendedCapitalAllocation,
    raw: result,
  };
}

export async function getAssetManagerSnapshot(userId: string, role: PlatformRole, assetId: string) {
  await assertAssetAccessible(userId, role, assetId);

  const ctx = await loadPortfolioAssetContext(assetId);
  if (!ctx) throw new Error("Not found");

  const policy = await getOrCreatePortfolioPolicy(userId);
  const health = computePortfolioHealth(ctx);
  await persistAssetHealth(assetId, health, ctx).catch(() => undefined);

  const strategy = selectAssetStrategy({ ctx, policy });
  const pendingPlans = await prisma.assetManagerPlan.findMany({
    where: { assetId, status: { in: ["PROPOSED", "DRAFT"] } },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const actions = await prisma.assetManagerAction.findMany({
    where: { assetId },
    orderBy: { updatedAt: "desc" },
    take: 40,
  });

  const outcomeHistory = await prisma.portfolioOutcomeEvent.findMany({
    where: { assetId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return {
    assetHealth: {
      ...health,
      confidence: effectiveConfidenceLabel(deriveConfidence(ctx), ctx),
      assetName: ctx.assetName,
    },
    strategy: {
      strategyType: strategy.strategyType,
      rationale: strategy.rationale,
      pendingPlans,
    },
    actions,
    outcomeHistory,
  };
}

export async function generateAssetManagerPlan(userId: string, role: PlatformRole, assetId: string) {
  await import("./portfolio-access").then((m) => m.assertAssetAccessible(userId, role, assetId));
  const ctx = await loadPortfolioAssetContext(assetId);
  if (!ctx) throw new Error("Not found");

  const policy = await getOrCreatePortfolioPolicy(userId);
  const health = computePortfolioHealth(ctx);
  const { strategyType, rationale } = selectAssetStrategy({ ctx, policy });
  const drafts = buildAssetManagerActions({ ctx, health, strategy: strategyType, policy });

  const version = `mgr-${Date.now().toString(36)}`;
  const plan = await prisma.assetManagerPlan.create({
    data: {
      assetId,
      version,
      status: policy.autonomyMode === "SAFE_APPROVAL" || policy.autonomyMode === "ASSIST" ? "PROPOSED" : "DRAFT",
      strategyType,
      objectiveMode: policy.primaryObjective,
      summaryText: rationale.join(" "),
      planJson: {
        drafts,
        healthSnapshot: {
          overall: health.overallHealthScore,
          band: health.healthBand,
        },
      } as object,
      rationaleJson: { lines: rationale } as object,
    },
  });

  let actionCount = 0;
  for (const d of drafts) {
    await prisma.assetManagerAction.create({
      data: {
        assetId,
        planId: plan.id,
        title: d.title,
        category: d.category,
        priority: d.priority,
        status:
          d.eligibleForAutoLowRisk && policy.autonomyMode === "AUTO_LOW_RISK" && !d.approvalRequired
            ? "ACTIVE"
            : "PENDING",
        expectedImpactBand: d.expectedImpactBand,
        costBand: d.costBand,
        timelineBand: d.timelineBand,
        ownerType: d.ownerType,
        explanation: d.explanation,
      },
    });
    actionCount++;
  }

  portfolioLog.assetManager("plan_generated", { assetId, planId: plan.id, actionCount });

  return {
    generated: plan,
    strategy: { strategyType, rationale },
    actionCount,
  };
}

export async function approveAssetManagerPlan(userId: string, role: PlatformRole, assetId: string, planId: string) {
  await assertAssetAccessible(userId, role, assetId);
  await prisma.assetManagerPlan.updateMany({
    where: { id: planId, assetId },
    data: { status: "APPROVED" },
  });
  await prisma.assetManagerAction.updateMany({
    where: { planId, assetId, status: "PENDING" },
    data: { status: "APPROVED" },
  });
  portfolioLog.assetManager("plan_approved", { assetId, planId });
  return { ok: true as const };
}

export async function rejectAssetManagerPlan(userId: string, role: PlatformRole, assetId: string, planId: string) {
  await assertAssetAccessible(userId, role, assetId);
  await prisma.assetManagerPlan.updateMany({
    where: { id: planId, assetId },
    data: { status: "REJECTED" },
  });
  portfolioLog.assetManager("plan_rejected", { assetId, planId });
  return { ok: true as const };
}
