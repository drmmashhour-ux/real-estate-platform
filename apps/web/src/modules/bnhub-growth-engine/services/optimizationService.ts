import { prisma } from "@/lib/db";
import { appendGrowthAuditLog } from "./growthAuditService";
import { computeCTR } from "../utils/metrics";
import { getGrowthConnectorAdapter } from "../connectors/registry";
import type { ConnectorResult } from "../connectors/types";

const LOW_CTR = 0.001;
const MIN_IMPRESSIONS_PAUSE = 500;
const MIN_IMPRESSIONS_EVAL = 200;

export { computeCTR };
export { computeCPL, computeROI } from "../utils/metrics";

export async function evaluateCampaignPerformance(campaignId: string) {
  const dists = await prisma.bnhubGrowthDistribution.findMany({
    where: { campaignId, distributionStatus: "PUBLISHED" },
    include: { connector: true },
  });
  let worstCtr = 1;
  let bestCtr = 0;
  for (const d of dists) {
    const ctr = computeCTR(d.impressions, d.clicks);
    worstCtr = Math.min(worstCtr, ctr);
    bestCtr = Math.max(bestCtr, ctr);
  }
  return { distributions: dists.length, worstCtr, bestCtr };
}

export async function detectWeakCampaigns(): Promise<string[]> {
  const dists = await prisma.bnhubGrowthDistribution.findMany({
    where: { distributionStatus: "PUBLISHED", impressions: { gte: MIN_IMPRESSIONS_EVAL } },
    select: { campaignId: true, impressions: true, clicks: true },
  });
  const weak = new Set<string>();
  for (const d of dists) {
    const ctr = computeCTR(d.impressions, d.clicks);
    if (ctr < LOW_CTR && d.impressions >= MIN_IMPRESSIONS_PAUSE) {
      weak.add(d.campaignId);
    }
  }
  return [...weak];
}

export async function applySafeOptimizationActions(): Promise<{ paused: number }> {
  const dists = await prisma.bnhubGrowthDistribution.findMany({
    where: { distributionStatus: "PUBLISHED", impressions: { gte: MIN_IMPRESSIONS_EVAL } },
    include: { campaign: true },
  });
  let paused = 0;
  for (const d of dists) {
    const ctr = computeCTR(d.impressions, d.clicks);
    if (ctr < LOW_CTR && d.impressions >= MIN_IMPRESSIONS_PAUSE) {
      await prisma.bnhubGrowthCampaign.update({
        where: { id: d.campaignId },
        data: { status: "PAUSED" },
      });
      paused++;
      await appendGrowthAuditLog({
        actorType: "SYSTEM",
        entityType: "bnhub_growth_campaign",
        entityId: d.campaignId,
        actionType: "autopause_low_ctr",
        actionSummary: `Paused campaign ${d.campaignId} — CTR ${(ctr * 100).toFixed(3)}%`,
      });
    }
  }
  return { paused };
}

export async function syncPublishedDistributionMetrics(limit = 40): Promise<{ synced: number; results: ConnectorResult[] }> {
  const dists = await prisma.bnhubGrowthDistribution.findMany({
    where: { distributionStatus: "PUBLISHED" },
    include: { connector: true },
    take: limit,
    orderBy: { updatedAt: "desc" },
  });
  const results: ConnectorResult[] = [];
  let synced = 0;
  for (const d of dists) {
    const adapter = getGrowthConnectorAdapter(d.connector.connectorCode);
    if (!adapter?.syncMetrics) continue;
    const r = await adapter.syncMetrics(d.id);
    results.push(r);
    if (r.ok) synced++;
    await appendGrowthAuditLog({
      actorType: "SYSTEM",
      entityType: "bnhub_growth_distribution",
      entityId: d.id,
      actionType: "metrics_sync",
      actionSummary: r.summary,
      afterJson: { ok: r.ok, connector: d.connector.connectorCode },
    });
  }
  return { synced, results };
}

export async function generateOptimizationActions(): Promise<void> {
  const weak = await detectWeakCampaigns();
  for (const campaignId of weak.slice(0, 20)) {
    const exists = await prisma.bnhubGrowthEngineRecommendation.findFirst({
      where: {
        campaignId,
        recommendationType: "COPY_REFRESH",
        status: "OPEN",
      },
    });
    if (exists) continue;
    await prisma.bnhubGrowthEngineRecommendation.create({
      data: {
        campaignId,
        recommendationType: "COPY_REFRESH",
        priority: "MEDIUM",
        title: "Low CTR — refresh creative",
        description: "Published distribution shows very low CTR; consider new angles or internal boost.",
        actionPayloadJson: { campaignId },
      },
    });
  }
}
