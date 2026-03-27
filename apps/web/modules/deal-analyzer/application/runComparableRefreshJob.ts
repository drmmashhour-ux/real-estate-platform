import { prisma } from "@/lib/db";
import { runComparableAnalysis } from "@/modules/deal-analyzer/application/runComparableAnalysis";
import { applyRegionPricingRules } from "@/modules/deal-analyzer/application/applyRegionPricingRules";
import {
  markJobCompleted,
  markJobFailed,
  markJobRunning,
} from "@/modules/deal-analyzer/infrastructure/services/refreshSchedulingService";
import { recordRefreshEvent } from "@/modules/deal-analyzer/infrastructure/services/comparableRefreshService";
import { RefreshEventType } from "@/modules/deal-analyzer/domain/refresh";
import { logDealAnalyzerPhase4 } from "@/modules/deal-analyzer/infrastructure/services/phase4Logger";

export async function runComparableRefreshJob(jobId: string) {
  const job = await prisma.dealAnalysisRefreshJob.findUnique({ where: { id: jobId } });
  if (!job) return { ok: false as const, error: "Job not found" };

  await markJobRunning(jobId);

  try {
    const regional = await applyRegionPricingRules(job.propertyId);
    if (!regional.ok) {
      await markJobFailed(jobId);
      return regional;
    }

    const analysisBefore = await prisma.dealAnalysis.findFirst({
      where: { propertyId: job.propertyId },
      orderBy: { createdAt: "desc" },
    });
    const prevSummary =
      analysisBefore?.summary && typeof analysisBefore.summary === "object"
        ? (analysisBefore.summary as Record<string, unknown>)
        : {};
    const prevPhase2 =
      typeof prevSummary.phase2 === "object" && prevSummary.phase2 != null
        ? (prevSummary.phase2 as Record<string, unknown>)
        : {};
    const prevComp = prevPhase2.comparablesSummary as { confidenceLevel?: string } | undefined;

    const listing = await prisma.fsboListing.findUnique({
      where: { id: job.propertyId },
      select: { priceCents: true },
    });
    if (!listing) {
      await markJobFailed(jobId);
      return { ok: false as const, error: "Listing not found" };
    }

    const comp = await runComparableAnalysis({
      listingId: job.propertyId,
      analysisId: job.analysisId ?? undefined,
      comparableSearchOverrides: regional.rules.comparableSearchOverrides,
      positioningOverrides: regional.rules.positioningOverrides,
      phase4Meta: {
        regionalProfileKey: regional.rules.profileKey,
        refreshTrigger: job.triggerSource,
      },
    });

    if (!comp.ok) {
      await markJobFailed(jobId);
      return comp;
    }

    const analysisAfter = await prisma.dealAnalysis.findFirst({
      where: { propertyId: job.propertyId },
      orderBy: { createdAt: "desc" },
    });
    const nextSummary =
      analysisAfter?.summary && typeof analysisAfter.summary === "object"
        ? (analysisAfter.summary as Record<string, unknown>)
        : {};
    const nextPhase2 =
      typeof nextSummary.phase2 === "object" && nextSummary.phase2 != null
        ? (nextSummary.phase2 as Record<string, unknown>)
        : {};
    const nextComp = nextPhase2.comparablesSummary as { confidenceLevel?: string } | undefined;

    if (analysisAfter) {
      const mergedPhase4 =
        typeof nextSummary.phase4 === "object" && nextSummary.phase4 != null
          ? { ...(nextSummary.phase4 as Record<string, unknown>) }
          : {};
      mergedPhase4.lastKnownPriceCents = listing.priceCents;
      mergedPhase4.regionalDataSparsityPenalty = regional.rules.dataSparsityPenalty;

      await prisma.dealAnalysis.update({
        where: { id: analysisAfter.id },
        data: {
          summary: {
            ...nextSummary,
            phase4: mergedPhase4,
          } as object,
        },
      });
    }

    await recordRefreshEvent({
      propertyId: job.propertyId,
      analysisId: analysisAfter?.id ?? null,
      eventType: RefreshEventType.COMPARABLES_REFRESHED,
      previousState: { confidence: prevComp?.confidenceLevel ?? null },
      newState: { confidence: nextComp?.confidenceLevel ?? null, outcome: comp.positioning?.outcome },
      confidenceDelta:
        prevComp?.confidenceLevel && nextComp?.confidenceLevel
          ? nextComp.confidenceLevel === prevComp.confidenceLevel
            ? 0
            : 1
          : null,
    });

    await markJobCompleted(jobId);

    logDealAnalyzerPhase4("comparable_refresh_completed", {
      jobId,
      propertyId: job.propertyId,
      analysisId: analysisAfter?.id ?? "",
      trigger: job.triggerSource,
      profileKey: regional.rules.profileKey,
    });

    return { ok: true as const, positioning: comp.positioning, jobId };
  } catch (e) {
    await markJobFailed(jobId);
    return { ok: false as const, error: e instanceof Error ? e.message : "refresh failed" };
  }
}
