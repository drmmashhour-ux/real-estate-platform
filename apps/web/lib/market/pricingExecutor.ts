import { ListingStatus } from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";
import { flags } from "@/lib/flags";
import { getListingPricingRecommendations, type ListingPricingRecommendation } from "@/lib/market/listingPricingEngine";

const prisma = getLegacyDB();

const MAX_UP_PCT = 15;
const MAX_DOWN_PCT = -10;
const MIN_NIGHT_USD = 20;
const MAX_NIGHT_USD = 2000;
const MIN_APPLY_PCT = 2;

const SOURCE = "AI_AUTONOMOUS" as const;
const MANUAL = "MANUAL" as const;

export type PricingExecuteChange = {
  listingId: string;
  oldPrice: number;
  newPrice: number;
  adjustmentPct: number;
  reason: string;
};

export type ExecutePricingResult = {
  executed: number;
  skipped: number;
  changes: PricingExecuteChange[];
  /** Set when both feature flags are off or execution bails early. */
  disabledReason?: string;
};

/**
 * Clamps the engine’s suggested % to hard bounds before dollar math.
 */
function clampAdjustment(percent: number): number {
  return Math.min(Math.max(percent, MAX_DOWN_PCT), MAX_UP_PCT);
}

function buildNewPriceDollars(
  currentDollars: number,
  rec: ListingPricingRecommendation
): { newDollars: number; reason: string; effectivePct: number; skip: string | null } {
  if (rec.recommendation === "keep_price") {
    return { newDollars: currentDollars, reason: rec.reason, effectivePct: 0, skip: "keep_price" };
  }
  const adj = clampAdjustment(rec.suggestedAdjustmentPercent);
  let newD = currentDollars * (1 + adj / 100);
  const preClamp = newD;
  newD = Math.max(MIN_NIGHT_USD, Math.min(MAX_NIGHT_USD, newD));
  const effectivePct = currentDollars > 0 ? ((newD - currentDollars) / currentDollars) * 100 : 0;
  let reason = rec.reason;
  if (newD !== preClamp) {
    reason = `${rec.reason} (clamped to $${MIN_NIGHT_USD}–$${MAX_NIGHT_USD} band.)`;
  }
  if (Math.abs(effectivePct) < MIN_APPLY_PCT) {
    return { newDollars: currentDollars, reason, effectivePct, skip: "change_below_2_pct_or_noop" };
  }
  return { newDollars: newD, reason, effectivePct, skip: null };
}

/**
 * Applies listing-level price recommendations to BNHub `nightPriceCents` with guardrails, audit log, and optional dry run.
 * Requires `FEATURE_AI_PRICING=1` **and** `FEATURE_AI_AGENT=1` (AUTONOMOUS_AGENT) to write; otherwise all rows are skipped.
 * Does not touch Stripe or booking flows.
 */
export async function executePricingRecommendations(options?: { dryRun?: boolean }): Promise<ExecutePricingResult> {
  const dryRun = options?.dryRun !== false;
  const recs = await getListingPricingRecommendations();
  if (!flags.AI_PRICING || !flags.AUTONOMOUS_AGENT) {
    return {
      executed: 0,
      skipped: recs.length,
      changes: [],
      disabledReason:
        "Requires FEATURE_AI_PRICING=1 and FEATURE_AI_AGENT=1 (autonomous apply). No recommendations applied or simulated.",
    };
  }

  const byId = new Map(
    (
      await prisma.shortTermListing.findMany({
        where: { id: { in: [...new Set(recs.map((r) => r.listingId))] } },
        select: { id: true, nightPriceCents: true, listingStatus: true },
      })
    ).map((l) => [l.id, l])
  );

  const changes: PricingExecuteChange[] = [];
  let executed = 0;
  let skipped = 0;

  for (const rec of recs) {
    if (rec.recommendation === "keep_price") {
      skipped += 1;
      continue;
    }
    const row = byId.get(rec.listingId);
    if (!row) {
      skipped += 1;
      continue;
    }
    if (row.listingStatus !== ListingStatus.PUBLISHED) {
      skipped += 1;
      continue;
    }
    const currentDollars = row.nightPriceCents / 100;
    if (!Number.isFinite(currentDollars) || currentDollars <= 0) {
      skipped += 1;
      continue;
    }
    const { newDollars, reason, effectivePct, skip } = buildNewPriceDollars(currentDollars, rec);
    if (skip) {
      skipped += 1;
      continue;
    }
    const newCents = Math.round(newDollars * 100);
    if (newCents === row.nightPriceCents) {
      skipped += 1;
      continue;
    }

    const entry: PricingExecuteChange = {
      listingId: rec.listingId,
      oldPrice: Math.round(currentDollars * 100) / 100,
      newPrice: Math.round(newDollars * 100) / 100,
      adjustmentPct: Math.round(effectivePct * 100) / 100,
      reason,
    };
    changes.push(entry);

    if (dryRun) {
      executed += 1;
      continue;
    }

    await prisma.$transaction([
      prisma.shortTermListing.update({
        where: { id: rec.listingId },
        data: { nightPriceCents: newCents },
      }),
      prisma.pricingExecutionLog.create({
        data: {
          listingId: rec.listingId,
          oldPrice: entry.oldPrice,
          newPrice: entry.newPrice,
          adjustmentPct: entry.adjustmentPct,
          reason: entry.reason,
          source: SOURCE,
        },
      }),
    ]);
    executed += 1;
  }

  return { executed, skipped, changes };
}

/**
 * Restores a listing to the `oldPrice` of its most recent execution log and records a `MANUAL` audit row.
 */
export async function rollbackLastPricing(
  listingId: string
): Promise<{ ok: boolean; error?: string; restoredTo?: number }> {
  const last = await prisma.pricingExecutionLog.findFirst({
    where: { listingId },
    orderBy: { createdAt: "desc" },
  });
  if (!last) {
    return { ok: false, error: "No execution log for this listing." };
  }
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { nightPriceCents: true },
  });
  if (!listing) {
    return { ok: false, error: "Listing not found." };
  }
  const currentDollars = listing.nightPriceCents / 100;
  const targetCents = Math.round(last.oldPrice * 100);
  if (targetCents === listing.nightPriceCents) {
    return { ok: true, restoredTo: last.oldPrice, error: "Already at previous price." };
  }
  const targetDollars = last.oldPrice;
  const pct = currentDollars > 0 ? ((targetDollars - currentDollars) / currentDollars) * 100 : 0;

  await prisma.$transaction([
    prisma.shortTermListing.update({
      where: { id: listingId },
      data: { nightPriceCents: targetCents },
    }),
    prisma.pricingExecutionLog.create({
      data: {
        listingId,
        oldPrice: Math.round(currentDollars * 100) / 100,
        newPrice: targetDollars,
        adjustmentPct: Math.round(pct * 100) / 100,
        reason: "Rollback: restored previous night price from last audit log.",
        source: MANUAL,
      },
    }),
  ]);
  return { ok: true, restoredTo: targetDollars };
}
