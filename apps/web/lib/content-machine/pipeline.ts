import { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { contentMachineDailyBudget, isContentMachineEnabled } from "@/lib/content-machine/env";
import { generateContent } from "@/lib/content-machine/generate";
import { createVideoForContentPiece } from "@/lib/content-machine/video";
import { scheduleDailySlots } from "@/lib/content-machine/scheduler";
import {
  analyzeContentOptimizationSignals,
  type ContentOptimizationSignals,
  type ExtendedOptimizationSignals,
} from "@/lib/content-machine/optimization";
import { refreshMachineContentScoreById } from "@/lib/content-intelligence/analyze-performance";

/**
 * Intended chain (see `docs/growth/listing-to-traffic-funnel.md`):
 * **Listing published** → content generated → video asset → scheduled slots → (auto-post when provider wired) → traffic.
 *
 * This function: generate 5 style rows → vertical 9:16 asset per row → optional `scheduleDailySlots` (TikTok/IG rows).
 */
export async function runContentMachineForListing(
  listingId: string,
  opts?: {
    force?: boolean;
    skipSchedule?: boolean;
    /** When set, generation favors winning styles and hook patterns from analytics. */
    optimizationSignals?: ContentOptimizationSignals | null;
  }
): Promise<{ contentIds: string[]; errors: string[] }> {
  const gen = await generateContent(listingId, {
    force: opts?.force,
    optimizationSignals: opts?.optimizationSignals,
  });
  if ("skipped" in gen) {
    return { contentIds: [], errors: [gen.reason] };
  }

  const errors: string[] = [];
  for (const id of gen.ids) {
    const v = await createVideoForContentPiece(id);
    if ("error" in v) errors.push(`${id}: ${v.error}`);
  }

  if (!opts?.skipSchedule) {
    const { created } = await scheduleDailySlots({
      contentIds: gen.ids,
      limit: gen.ids.length,
    });
    if (created === 0) errors.push("schedule: no slots created (nothing ready or already scheduled)");
  }

  return { contentIds: gen.ids, errors };
}

/** Published stays that never got a machine row (e.g. created before automation was on). */
export async function backfillMachineContentForListingsWithoutPieces(opts?: {
  /** Max listings to run (each produces 5 style rows + renders). Default 2/day to stay within cron budget. */
  limit?: number;
}): Promise<{ processed: number; errors: string[] }> {
  if (!isContentMachineEnabled()) return { processed: 0, errors: [] };

  const limit = Math.min(Math.max(opts?.limit ?? 2, 1), 5);
  const candidates = await prisma.shortTermListing.findMany({
    where: {
      listingStatus: ListingStatus.PUBLISHED,
      machineGeneratedContents: { none: {} },
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: { id: true },
  });

  const errors: string[] = [];
  let processed = 0;
  for (const c of candidates) {
    const out = await runContentMachineForListing(c.id, { skipSchedule: true });
    if (out.contentIds.length) processed += 1;
    errors.push(...out.errors);
  }

  return { processed, errors };
}

/** Daily cron: backfill a few listings without machine rows, then schedule backlog slots. */
export async function runContentMachineDailyCron(): Promise<{
  scheduled: number;
  backfillProcessed: number;
  skipped?: boolean;
}> {
  if (!isContentMachineEnabled()) {
    return { scheduled: 0, backfillProcessed: 0, skipped: true };
  }

  const { processed, errors } = await backfillMachineContentForListingsWithoutPieces();
  if (errors.length) {
    console.warn("[content-machine] daily backfill warnings", errors.slice(0, 5));
  }

  const { created } = await scheduleDailySlots();
  return { scheduled: created, backfillProcessed: processed };
}

/** Phase 8 — aggregate performance by style (uses denormalized counters on pieces). */
export async function getBestPerformingStyles(limit = 5) {
  return prisma.machineGeneratedContent.groupBy({
    by: ["style"],
    _sum: { views: true, clicks: true, conversions: true },
    _count: { id: true },
    orderBy: { _sum: { conversions: "desc" } },
    take: limit,
  });
}

async function resolveListingIdsForOptimizationLoop(opts: {
  listingIds?: string[];
  cohortListingIds: string[];
  listingLimit: number;
}): Promise<string[]> {
  const limit = Math.max(1, opts.listingLimit);
  if (opts.listingIds?.length) {
    return opts.listingIds.slice(0, limit);
  }
  if (opts.cohortListingIds.length > 0) {
    return opts.cohortListingIds.slice(0, limit);
  }
  const published = await prisma.shortTermListing.findMany({
    where: { listingStatus: ListingStatus.PUBLISHED },
    take: limit,
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  return published.map((p) => p.id);
}

/**
 * Self-improving loop: analyze top-percentile pieces, then run the full pipeline for a batch of listings
 * using those signals (biased scripts + style ordering).
 */
export async function runContentOptimizationLoop(opts?: {
  percentileFraction?: number;
  listingLimit?: number;
  listingIds?: string[];
  skipSchedule?: boolean;
}): Promise<{
  signals: ExtendedOptimizationSignals | null;
  results: { listingId: string; contentIds: string[]; errors: string[] }[];
}> {
  const percentileFraction = opts?.percentileFraction ?? 0.1;
  const listingLimit = opts?.listingLimit ?? 12;

  const signals = await analyzeContentOptimizationSignals(percentileFraction);
  if (!signals) {
    return { signals: null, results: [] };
  }

  const targetIds = await resolveListingIdsForOptimizationLoop({
    listingIds: opts?.listingIds,
    cohortListingIds: signals.cohortListingIds,
    listingLimit,
  });

  const results: { listingId: string; contentIds: string[]; errors: string[] }[] = [];

  for (const listingId of targetIds) {
    const out = await runContentMachineForListing(listingId, {
      force: true,
      skipSchedule: opts?.skipSchedule,
      optimizationSignals: signals,
    });
    results.push({ listingId, contentIds: out.contentIds, errors: out.errors });
  }

  return { signals, results };
}

export async function recordContentMetrics(
  contentId: string,
  patch: {
    views?: number;
    clicks?: number;
    conversions?: number;
    saves?: number;
    shares?: number;
    bookings?: number;
    revenueCents?: number;
  }
): Promise<void> {
  const data: Record<string, { increment: number }> = {};
  if (patch.views != null) data.views = { increment: patch.views };
  if (patch.clicks != null) data.clicks = { increment: patch.clicks };
  if (patch.conversions != null) data.conversions = { increment: patch.conversions };
  if (patch.saves != null) data.saves = { increment: patch.saves };
  if (patch.shares != null) data.shares = { increment: patch.shares };
  if (patch.bookings != null) data.bookings = { increment: patch.bookings };
  if (patch.revenueCents != null) data.revenueCents = { increment: patch.revenueCents };
  if (!Object.keys(data).length) return;
  await prisma.machineGeneratedContent.update({
    where: { id: contentId },
    data: {
      ...data,
      metricsSyncedAt: new Date(),
    },
  });
  await refreshMachineContentScoreById(contentId);
}
