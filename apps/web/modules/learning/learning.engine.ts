/**
 * LECIPM self-learning loop — records outcomes, extracts patterns, applies tiny bounded nudges to `dealScore`.
 * Advisory / statistical — not reinforcement learning with guarantees.
 */

import { prisma } from "@/lib/db";
import { metricsLog } from "@/lib/metrics-log";
import { extractPatternsFromDealOutcomes } from "@/modules/learning/pattern.extractor";
import type { DealOutcomeSlice } from "@/modules/learning/learning.types";
import { clamp } from "@/modules/investment/recommendation-math";

const TERMINAL_CLOSED = new Set(["closed"]);
const TERMINAL_FAILED = new Set(["cancelled"]);

function dealOutcomeLabel(status: string): "CLOSED" | "FAILED" | null {
  const s = status.toLowerCase();
  if (TERMINAL_CLOSED.has(s)) return "CLOSED";
  if (TERMINAL_FAILED.has(s)) return "FAILED";
  return null;
}

async function referenceListPriceMajor(deal: {
  listingId: string | null;
}): Promise<number | null> {
  if (!deal.listingId) return null;
  const crm = await prisma.listing.findUnique({
    where: { id: deal.listingId },
    select: { price: true },
  });
  if (crm && crm.price > 0) return crm.price;

  const st = await prisma.shortTermListing.findUnique({
    where: { id: deal.listingId },
    select: {
      investmentEstimatedValueMajor: true,
      investmentPurchasePriceMajor: true,
    },
  });
  const inv = st?.investmentEstimatedValueMajor ?? st?.investmentPurchasePriceMajor;
  if (inv != null && inv > 0) return inv;

  return null;
}

/**
 * Upsert `DealOutcome` rows for deals in terminal states that are missing an outcome row.
 */
export async function syncTerminalDealOutcomes(limit = 500): Promise<{ created: number }> {
  const candidates = await prisma.deal.findMany({
    where: {
      status: { in: [...TERMINAL_CLOSED, ...TERMINAL_FAILED] },
      dealOutcomes: { none: {} },
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      priceCents: true,
      listingId: true,
    },
    take: limit,
    orderBy: { updatedAt: "desc" },
  });

  let created = 0;
  for (const d of candidates) {
    const label = dealOutcomeLabel(d.status);
    if (!label) continue;

    const durationDays = Math.max(
      0,
      Math.round((d.updatedAt.getTime() - d.createdAt.getTime()) / 86_400_000),
    );
    const dealMajor = d.priceCents / 100;
    const ref = await referenceListPriceMajor({ listingId: d.listingId });
    let priceDelta = 0;
    if (ref != null && ref > 0) {
      priceDelta = (dealMajor - ref) / ref;
    }

    await prisma.dealOutcome.create({
      data: {
        dealId: d.id,
        outcome: label,
        duration: durationDays,
        priceDelta,
      },
    });
    created += 1;
  }

  return { created };
}

/**
 * Refresh `LearningPattern` table from all stored outcomes (idempotent upsert by pattern text).
 */
export async function refreshLearningPatternsFromOutcomes(): Promise<{ upserted: number }> {
  const rows = await prisma.dealOutcome.findMany({
    select: { outcome: true, duration: true, priceDelta: true },
  });

  const slices: DealOutcomeSlice[] = rows.map((r) => ({
    outcome: r.outcome,
    durationDays: r.duration,
    priceDelta: r.priceDelta,
  }));

  const extracted = extractPatternsFromDealOutcomes(slices);
  let upserted = 0;

  for (const p of extracted) {
    await prisma.learningPattern.upsert({
      where: { pattern: p.pattern },
      create: {
        pattern: p.pattern,
        confidence: p.confidence,
        impactScore: p.impactScore,
        sampleSize: p.sampleSize,
      },
      update: {
        confidence: p.confidence,
        impactScore: p.impactScore,
        sampleSize: p.sampleSize,
      },
    });
    upserted += 1;
  }

  return { upserted };
}

/** Bounded influence on open deals — keeps intelligence scores fresh without overwriting broker signals. */
export async function applyLearningNudgesToOpenDeals(params?: {
  maxDeals?: number;
  maxAbsDelta?: number;
}): Promise<{ adjusted: number }> {
  const maxDeals = params?.maxDeals ?? 200;
  const maxAbsDelta = params?.maxAbsDelta ?? 3;

  const patterns = await prisma.learningPattern.findMany({
    orderBy: { impactScore: "desc" },
    take: 5,
    select: { impactScore: true },
  });
  if (patterns.length === 0) return { adjusted: 0 };

  const boost =
    patterns.reduce((s, p) => s + (p.impactScore > 60 ? 1 : p.impactScore > 35 ? 0.5 : 0.25), 0) /
    Math.max(1, patterns.length);

  const open = await prisma.deal.findMany({
    where: {
      status: { notIn: ["closed", "cancelled"] },
    },
    select: { id: true, dealScore: true },
    take: maxDeals,
    orderBy: { updatedAt: "desc" },
  });

  let adjusted = 0;
  for (const d of open) {
    const base = d.dealScore ?? 52;
    const delta = clamp((boost - 0.5) * maxAbsDelta * 0.04, -maxAbsDelta, maxAbsDelta);
    const next = clamp(base + delta, 1, 99);
    if (Math.abs(next - base) < 0.01) continue;
    await prisma.deal.update({
      where: { id: d.id },
      data: { dealScore: next },
    });
    adjusted += 1;
  }

  return { adjusted };
}

/**
 * Full maintenance pass: ingest outcomes → patterns → optional score nudges.
 */
export async function runLearningMaintenance(): Promise<{
  outcomesCreated: number;
  patternsUpserted: number;
  dealsAdjusted: number;
}> {
  const { created } = await syncTerminalDealOutcomes();
  const { upserted } = await refreshLearningPatternsFromOutcomes();
  const { adjusted } = await applyLearningNudgesToOpenDeals();
  metricsLog.learning("maintenance_complete", {
    outcomesCreated: created,
    patternsUpserted: upserted,
    dealsAdjusted: adjusted,
  });
  return {
    outcomesCreated: created,
    patternsUpserted: upserted,
    dealsAdjusted: adjusted,
  };
}
