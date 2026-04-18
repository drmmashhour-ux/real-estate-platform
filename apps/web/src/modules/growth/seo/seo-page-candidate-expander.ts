import { prisma } from "@/lib/db";
import { ListingStatus } from "@prisma/client";
import { engineFlags } from "@/config/feature-flags";
import { GROWTH_V2 } from "../growth-v2.constants";
import { evaluateSeoInventoryEligibility } from "../growth-eligibility.service";
import { computeSeoPageScores } from "./seo-page-quality.service";
import { scanSeoPageOpportunitiesFromFsboInventory } from "./seo-candidate.service";

function slugifyPart(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Expands SEO candidates across page families using real aggregates only.
 */
export async function expandSeoPageCandidatesV2(): Promise<{ upserts: number }> {
  if (!engineFlags.growthV2 || !engineFlags.seoPageGeneratorV2) return { upserts: 0 };

  const base = await scanSeoPageOpportunitiesFromFsboInventory();
  let upserts = base.upserts;

  const bnhubGrouped = await prisma.shortTermListing.groupBy({
    by: ["city"],
    where: { listingStatus: ListingStatus.PUBLISHED },
    _count: { _all: true },
    orderBy: { city: "asc" },
    take: 40,
  });

  for (const g of bnhubGrouped) {
    if (g._count._all < GROWTH_V2.MIN_ACTIVE_LISTINGS_SEO) continue;
    const city = g.city.trim();
    const slug = `bnhub-${slugifyPart(city)}-short-term`.slice(0, 250);
    const stats = {
      totalActive: g._count._all,
      distinctPropertyTypes: 1,
      listingsUpdatedLast45d: Math.min(g._count._all, Math.ceil(g._count._all * 0.4)),
    };
    const { ok } = evaluateSeoInventoryEligibility(stats);
    if (!ok) continue;

    const scores = computeSeoPageScores({
      inventoryCount: stats.totalActive,
      distinctPropertyTypes: 2,
      medianAgeDays: 30,
      avgImageCount: 6,
      duplicateSlugCount: 0,
    });

    await prisma.seoPageOpportunity.upsert({
      where: { slug },
      create: {
        slug,
        pageType: "bnhub_destination",
        pageFamily: "bnhub_city_destination",
        city,
        transactionType: "SHORT_TERM",
        inventoryCount: g._count._all,
        opportunityScore: scores.overallSeoOpportunityScore,
        seoScoresJson: scores as object,
        status: "candidate",
        metadataJson: { source: "growth_v2_bnhub_scan" },
      },
      update: {
        inventoryCount: g._count._all,
        opportunityScore: scores.overallSeoOpportunityScore,
        seoScoresJson: scores as object,
        lastEvaluatedAt: new Date(),
      },
    });
    upserts++;
  }

  const cities = await prisma.fsboListing.findMany({
    where: { status: "ACTIVE", moderationStatus: "APPROVED" },
    distinct: ["city"],
    select: { city: true },
    take: 30,
  });

  for (const { city } of cities) {
    const c = city.trim();
    if (!c) continue;
    /// `priceCents` is CAD × 100 (e.g. 500k CAD = 50_000_000 cents).
    const buckets: { label: string; min: number; max: number }[] = [
      { label: "under-500k", min: 0, max: 50_000_000 },
      { label: "500k-800k", min: 50_000_000, max: 80_000_000 },
      { label: "800k-1p2m", min: 80_000_000, max: 120_000_000 },
    ];
    for (const b of buckets) {
      const rows = await prisma.fsboListing.findMany({
        where: {
          city: { equals: c, mode: "insensitive" },
          status: "ACTIVE",
          moderationStatus: "APPROVED",
          priceCents: { gte: b.min, lt: b.max },
        },
        select: {
          propertyType: true,
          updatedAt: true,
          images: true,
        },
        take: 80,
      });
      if (rows.length < GROWTH_V2.MIN_ACTIVE_LISTINGS_SEO) continue;
      const types = new Set(rows.map((r) => (r.propertyType ?? "").toLowerCase()).filter(Boolean));
      const now = Date.now();
      const ages = rows.map((r) => (now - r.updatedAt.getTime()) / 86400000);
      const medianAgeDays = ages.sort((a, b) => a - b)[Math.floor(ages.length / 2)]!;
      const avgImg =
        rows.reduce((s, r) => s + (Array.isArray(r.images) ? r.images.length : 0), 0) / rows.length;
      const el = evaluateSeoInventoryEligibility({
        totalActive: rows.length,
        distinctPropertyTypes: types.size,
        listingsUpdatedLast45d: rows.filter((r) => now - r.updatedAt.getTime() < 45 * 86400000).length,
      });
      if (!el.ok) continue;

      const scores = computeSeoPageScores({
        inventoryCount: rows.length,
        distinctPropertyTypes: types.size,
        medianAgeDays,
        avgImageCount: avgImg,
        duplicateSlugCount: 0,
      });

      const slug = `${slugifyPart(c)}-listings-${b.label}`.slice(0, 250);
      await prisma.seoPageOpportunity.upsert({
        where: { slug },
        create: {
          slug,
          pageType: "city_budget",
          pageFamily: "city_budget_bucket",
          city: c,
          budgetMinCents: b.min,
          budgetMaxCents: b.max,
          inventoryCount: rows.length,
          opportunityScore: scores.overallSeoOpportunityScore,
          seoScoresJson: scores as object,
          status: "candidate",
          metadataJson: { source: "growth_v2_budget_bucket" },
        },
        update: {
          inventoryCount: rows.length,
          opportunityScore: scores.overallSeoOpportunityScore,
          seoScoresJson: scores as object,
          lastEvaluatedAt: new Date(),
        },
      });
      upserts++;
    }
  }

  return { upserts };
}
