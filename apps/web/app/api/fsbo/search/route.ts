import type { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { fsboCityWhereFromParam } from "@/lib/geo/city-search";
import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";
import { applyListingRankingBoostIfEnabled } from "@/lib/trustgraph/application/integrations/listingRankingIntegration";
import type { TrustScore } from "@/modules/trust/trust.types";
import {
  applyLegalTrustRanking,
  computeLegalTrustRankingImpact,
} from "@/modules/trust-ranking/legal-trust-ranking.service";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 60;

/**
 * GET /api/fsbo/search — Paginated public FSBO catalog (ACTIVE + APPROVED).
 * Query: city (case-insensitive; supports montreal | laval | quebec slugs), page, limit,
 *        minPrice, maxPrice, bedrooms (min).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cityRaw = searchParams.get("city")?.trim() ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
    );
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const bedrooms = searchParams.get("bedrooms");
    const bathrooms = searchParams.get("bathrooms");
    const propertyType = searchParams.get("propertyType")?.trim() ?? "";

    const and: Prisma.FsboListingWhereInput[] = [
      { status: "ACTIVE" },
      { moderationStatus: "APPROVED" },
    ];

    if (cityRaw) {
      and.push(fsboCityWhereFromParam(cityRaw));
    }

    if (minPrice) {
      const n = parseInt(minPrice, 10);
      if (Number.isFinite(n) && n >= 0) and.push({ priceCents: { gte: n * 100 } });
    }
    if (maxPrice) {
      const n = parseInt(maxPrice, 10);
      if (Number.isFinite(n) && n >= 0) and.push({ priceCents: { lte: n * 100 } });
    }
    if (bedrooms) {
      const n = parseInt(bedrooms, 10);
      if (Number.isFinite(n) && n >= 0) and.push({ bedrooms: { gte: n } });
    }
    if (bathrooms) {
      const n = parseInt(bathrooms, 10);
      if (Number.isFinite(n) && n >= 0) and.push({ bathrooms: { gte: n } });
    }

    const where: Prisma.FsboListingWhereInput = { AND: and };
    const skip = (page - 1) * limit;

    const rankingSelect = {
      id: true,
      title: true,
      priceCents: true,
      city: true,
      bedrooms: true,
      bathrooms: true,
      images: true,
      coverImage: true,
      latitude: true,
      longitude: true,
      updatedAt: true,
      publishPlan: true,
      propertyType: true,
      featuredUntil: true,
      sellerDeclarationJson: true,
      sellerDeclarationCompletedAt: true,
    } as const;

    const [total, rowsRaw] = await Promise.all([
      prisma.fsboListing.count({ where }),
      prisma.fsboListing.findMany({
        where,
        orderBy: [
          { featuredUntil: { sort: "desc", nulls: "last" } },
          { updatedAt: "desc" },
        ],
        skip,
        take: limit,
        select: rankingSelect,
      }),
    ]);

    let { rows: boosted, publicAugmentations } = await applyListingRankingBoostIfEnabled(rowsRaw);

    if (engineFlags.legalTrustRankingV1 === true && boosted.length > 1) {
      try {
        const indexed = boosted.map((row, orderIdx) => {
          const baseScore = 500 - orderIdx;
          const readiness = typeof row.trustScore === "number" ? Math.min(100, row.trustScore + 12) : 72;
          const legalRisk = typeof row.riskScore === "number" ? row.riskScore : 38;
          const trustStub: TrustScore = {
            score: typeof row.trustScore === "number" ? row.trustScore : 58,
            level: "medium",
            confidence: "low",
            factors: [],
          };
          const impact = computeLegalTrustRankingImpact({
            listingId: row.id,
            trustScore: trustStub,
            publishSummary: {
              listingId: row.id,
              readinessScore: readiness,
              legalRiskScore: legalRisk,
              blockingIssues: [],
              warnings: [],
              requiredChecklistPassed: true,
            },
            prepublishBlocked: false,
            isPublishedVisible: true,
          });
          const ranked = applyLegalTrustRanking(baseScore, impact);
          return { row, sortKey: ranked.finalScore };
        });
        indexed.sort((a, b) => b.sortKey - a.sortKey);
        boosted = indexed.map((x) => x.row);
      } catch {
        /* keep boost order */
      }
    }

    const data = boosted.map((row) => {
      const aug = publicAugmentations?.get(row.id);
      if (!aug) return row;
      return {
        ...row,
        trustRanking: {
          publicBadgeReasons: aug.publicBadgeReasons,
        },
      };
    });

    return Response.json({
      data,
      total,
      page,
      limit,
      hasMore: total > skip + rowsRaw.length,
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "FSBO search failed" }, { status: 500 });
  }
}
