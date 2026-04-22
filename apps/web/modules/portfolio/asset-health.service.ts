import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import type { HealthBand, PerformanceLevel, RiskLevel } from "./portfolio.types";
import { appendPortfolioAuditEvent } from "./portfolio-events.service";
import { getLatestPerformance } from "./asset-performance.service";

const TAG = "[portfolio.health]";

/** Explainable weighted score 0–100 from latest performance metrics. */
export async function computeAndStoreHealthScore(
  assetId: string,
  portfolioIdForAudit: string | null,
  actorUserId: string | null
) {
  const perf = await getLatestPerformance(assetId);
  const asset = await prisma.lecipmPortfolioAsset.findUnique({
    where: { id: assetId },
    select: { acquisitionPrice: true, assetName: true },
  });
  if (!asset) throw new Error("Asset not found");

  const revenue = perf?.revenue ?? 0;
  const expenses = perf?.expenses ?? 0;
  const noi = perf?.noi ?? revenue - expenses;
  const occupancy = perf?.occupancyRate ?? 0;

  const margin = revenue > 0 ? noi / revenue : noi <= 0 ? 0 : 0.5;
  const revenueNorm = Math.min(100, Math.max(0, (revenue / Math.max(asset.acquisitionPrice * 0.08, 1)) * 50));
  const occNorm = Math.min(100, occupancy);
  const marginNorm = Math.min(100, Math.max(0, margin * 100));
  const expensePressure = revenue > 0 ? Math.min(100, (expenses / revenue) * 40) : expenses > 0 ? 60 : 0;

  let score =
    revenueNorm * 0.28 + occNorm * 0.22 + marginNorm * 0.35 + (100 - expensePressure) * 0.15;
  score = Math.round(Math.min(100, Math.max(0, score)) * 100) / 100;

  let band: HealthBand = "D";
  if (score >= 85) band = "A";
  else if (score >= 70) band = "B";
  else if (score >= 55) band = "C";

  let riskLevel: RiskLevel = "HIGH";
  if (score >= 75 && margin > 0.15) riskLevel = "LOW";
  else if (score >= 55) riskLevel = "MEDIUM";

  let performanceLevel: PerformanceLevel = "WEAK";
  if (score >= 80) performanceLevel = "STRONG";
  else if (score >= 60) performanceLevel = "STABLE";

  const rationalePublic =
    `Score ${score}/100 derived from observed revenue (${revenue.toFixed(0)}), NOI margin (~${(margin * 100).toFixed(1)}%), occupancy (${occupancy.toFixed(1)}%), expense ratio vs revenue — weights: revenue 28%, occupancy 22%, margin 35%, expense discipline 15%.`;

  const row = await prisma.lecipmPortfolioAssetHealthScore.create({
    data: {
      assetId,
      score,
      band,
      riskLevel,
      performanceLevel,
      rationalePublic,
    },
  });

  if (portfolioIdForAudit) {
    await appendPortfolioAuditEvent(portfolioIdForAudit, {
      eventType: "HEALTH_UPDATED",
      summary: `Health ${band} (${score}) for ${asset.assetName}`,
      actorUserId,
      metadataJson: {
        assetId,
        score,
        band,
        inputs: { revenue, expenses, noi, occupancy },
      },
    });
  }

  logInfo(TAG, { assetId, score, band });
  return row;
}

export async function getLatestHealth(assetId: string) {
  return prisma.lecipmPortfolioAssetHealthScore.findFirst({
    where: { assetId },
    orderBy: { createdAt: "desc" },
  });
}
