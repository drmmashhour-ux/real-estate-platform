import { prisma } from "@/lib/db";
import { evaluateRefreshNeed } from "@/modules/deal-analyzer/application/evaluateRefreshNeed";
import type {
  NegotiationPlaybookPublicDto,
  PortfolioMonitoringEventDto,
  PortfolioMonitoringSummaryDto,
  RefreshStatusPublicDto,
  RepricingReviewPublicDto,
} from "@/modules/deal-analyzer/domain/contracts";
import type { DealNegotiationPlaybook, PortfolioMonitoringEvent, SellerRepricingReview } from "@prisma/client";

export async function buildRefreshStatusDto(listingId: string): Promise<RefreshStatusPublicDto> {
  const analysis = await prisma.dealAnalysis.findFirst({
    where: { propertyId: listingId },
    orderBy: { createdAt: "desc" },
  });
  const summary =
    analysis?.summary && typeof analysis.summary === "object" ? (analysis.summary as Record<string, unknown>) : {};
  const phase4 =
    typeof summary.phase4 === "object" && summary.phase4 != null ? (summary.phase4 as Record<string, unknown>) : {};

  const pending = await prisma.dealAnalysisRefreshJob.findMany({
    where: { propertyId: listingId, status: { in: ["pending", "running"] } },
    orderBy: { scheduledAt: "asc" },
    take: 10,
  });

  const need = await evaluateRefreshNeed(listingId);

  return {
    lastComparableRefreshAt:
      typeof phase4.lastComparableRefreshAt === "string" ? phase4.lastComparableRefreshAt : null,
    regionalProfileKey: typeof phase4.regionalProfileKey === "string" ? phase4.regionalProfileKey : null,
    lastKnownPriceCents: typeof phase4.lastKnownPriceCents === "number" ? phase4.lastKnownPriceCents : null,
    pendingJobs: pending.map((p) => ({
      id: p.id,
      status: p.status,
      scheduledAt: p.scheduledAt.toISOString(),
      triggerSource: p.triggerSource,
    })),
    evaluateReasons: need.reasons,
  };
}

export function mapNegotiationPlaybookRow(row: DealNegotiationPlaybook): NegotiationPlaybookPublicDto {
  const stepsRaw = row.playbookSteps;
  const steps: NegotiationPlaybookPublicDto["playbookSteps"] = [];
  if (Array.isArray(stepsRaw)) {
    for (const s of stepsRaw) {
      if (s && typeof s === "object" && "step" in s && "rationale" in s) {
        const o = s as { step: unknown; rationale: unknown };
        if (typeof o.step === "string" && typeof o.rationale === "string") {
          steps.push({ step: o.step, rationale: o.rationale });
        }
      }
    }
  }
  const warnings = Array.isArray(row.warnings)
    ? row.warnings.filter((w): w is string => typeof w === "string")
    : [];

  return {
    id: row.id,
    marketCondition: row.marketCondition,
    posture: row.posture,
    confidenceLevel: row.confidenceLevel,
    playbookSteps: steps,
    warnings,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapRepricingReviewRow(row: SellerRepricingReview): RepricingReviewPublicDto {
  const reasonsRaw = row.reasons;
  const reasons: string[] = Array.isArray(reasonsRaw)
    ? reasonsRaw.filter((r): r is string => typeof r === "string")
    : [];

  return {
    propertyId: row.propertyId,
    currentPriceCents: row.currentPriceCents,
    currentPosition: row.currentPosition,
    suggestedAction: row.suggestedAction,
    confidenceLevel: row.confidenceLevel,
    reasons,
    explanation: row.explanation,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapMonitoringSummaryJson(summary: unknown): PortfolioMonitoringSummaryDto | null {
  if (!summary || typeof summary !== "object") return null;
  const s = summary as Record<string, unknown>;
  return {
    watchlistId: String(s.watchlistId ?? ""),
    evaluatedAt: String(s.evaluatedAt ?? new Date().toISOString()),
    upgradedCount: Number(s.upgradedCount ?? 0),
    downgradedCount: Number(s.downgradedCount ?? 0),
    trustDroppedCount: Number(s.trustDroppedCount ?? 0),
    repricingRecommendedCount: Number(s.repricingRecommendedCount ?? 0),
    biggestMovers: Array.isArray(s.biggestMovers)
      ? (s.biggestMovers as { propertyId?: string; deltaScore?: number }[]).map((m) => ({
          propertyId: String(m.propertyId ?? ""),
          deltaScore: Number(m.deltaScore ?? 0),
        }))
      : [],
    confidence: String(s.confidence ?? "low"),
    warnings: Array.isArray(s.warnings) ? s.warnings.filter((w): w is string => typeof w === "string") : [],
  };
}

export function mapPortfolioMonitoringEventRow(row: PortfolioMonitoringEvent): PortfolioMonitoringEventDto {
  return {
    id: row.id,
    watchlistId: row.watchlistId,
    propertyId: row.propertyId,
    eventType: row.eventType,
    severity: row.severity,
    title: row.title,
    message: row.message,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}
