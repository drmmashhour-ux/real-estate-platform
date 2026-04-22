import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { appendPortfolioAuditEvent } from "./portfolio-events.service";

const TAG = "[portfolio.performance]";

export function calculateNOI(revenue: number | null | undefined, expenses: number | null | undefined): number | null {
  if (revenue == null || expenses == null) return null;
  return revenue - expenses;
}

export function calculateOccupancy(rate: number | null | undefined): number | null {
  if (rate == null || Number.isNaN(rate)) return null;
  return Math.min(100, Math.max(0, rate));
}

export async function recordPerformance(
  assetId: string,
  data: {
    revenue?: number | null;
    expenses?: number | null;
    occupancyRate?: number | null;
    period: string;
  },
  portfolioIdForAudit: string | null,
  actorUserId: string | null
) {
  const noi = calculateNOI(data.revenue ?? null, data.expenses ?? null);
  const occ = calculateOccupancy(data.occupancyRate ?? null);

  const row = await prisma.lecipmPortfolioAssetPerformance.create({
    data: {
      assetId,
      revenue: data.revenue ?? undefined,
      expenses: data.expenses ?? undefined,
      noi: noi ?? undefined,
      occupancyRate: occ ?? undefined,
      period: data.period.slice(0, 16),
    },
  });

  if (portfolioIdForAudit) {
    await appendPortfolioAuditEvent(portfolioIdForAudit, {
      eventType: "PERFORMANCE_UPDATED",
      summary: `Performance recorded for asset ${assetId} (${data.period})`,
      actorUserId,
      metadataJson: { performanceId: row.id, noi, occupancyRate: occ },
    });
  }

  logInfo(TAG, { assetId, id: row.id });
  return row;
}

export async function getLatestPerformance(assetId: string) {
  return prisma.lecipmPortfolioAssetPerformance.findFirst({
    where: { assetId },
    orderBy: { createdAt: "desc" },
  });
}
