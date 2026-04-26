import type { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { getSessionUserIdFromRequest } from "@/lib/auth/api-session";
import { fsboCityWhereFromParam } from "@/lib/geo/city-search";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { reorderListingsForWave13Personalization } from "@/modules/user-intelligence/services/user-personalization.service";
import { engineFlags } from "@/config/feature-flags";
import { applyListingRankingBoostIfEnabled } from "@/lib/trustgraph/application/integrations/listingRankingIntegration";
import type { TrustScore } from "@/modules/trust/trust.types";
import {
  applyLegalTrustRanking,
  computeLegalTrustRankingImpact,
} from "@/modules/trust-ranking/legal-trust-ranking.service";
import { decorateListingWithGreenSignals, toPublicListingGreenPayload } from "@/modules/green-ai/green-search-decoration.service";
import { applyGreenSearchFilters, isGreenFiltersActive } from "@/modules/green-ai/green-search-filter.service";
import { rankListingsWithGreenSignals } from "@/modules/green-ai/green-ranking.service";
import type { GreenSearchFilters, GreenRankingSortMode } from "@/modules/green-ai/green-search.types";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 60;

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
  lecipmGreenInternalScore: true,
  lecipmGreenMetadataJson: true,
  lecipmGreenAiLabel: true,
  yearBuilt: true,
} as const;

type FsboSelectRow = {
  id: string;
  [k: string]: unknown;
};

function applyPrismaGreenHints(and: Prisma.FsboListingWhereInput[], filters: GreenSearchFilters | undefined) {
  if (typeof filters?.minimumQuebecScore === "number") {
    and.push({ lecipmGreenInternalScore: { gte: filters.minimumQuebecScore } });
  }
  if (filters?.minimumGreenLabel) {
    const m = filters.minimumGreenLabel;
    if (m === "GREEN") and.push({ lecipmGreenAiLabel: "GREEN" });
    if (m === "IMPROVABLE") and.push({ lecipmGreenAiLabel: { in: ["IMPROVABLE", "GREEN"] } });
    if (m === "LOW") {
      and.push({ lecipmGreenAiLabel: { in: ["LOW", "IMPROVABLE", "GREEN"] } });
    }
  }
}

async function buildResponse(rowsRaw: FsboSelectRow[]) {
  let { rows: boosted, publicAugmentations } = await applyListingRankingBoostIfEnabled(
    rowsRaw as Parameters<typeof applyListingRankingBoostIfEnabled>[0]
  );

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

  const decById = new Map(boosted.map((r) => [r.id, decorateListingWithGreenSignals(r)] as const));
  return boosted.map((row) => {
    const aug = publicAugmentations?.get(row.id);
    const d = decById.get(row.id)!;
    if (!aug) {
      return { ...row, green: toPublicListingGreenPayload(d) };
    }
    return {
      ...row,
      green: toPublicListingGreenPayload(d),
      trustRanking: { publicBadgeReasons: aug.publicBadgeReasons },
    };
  });
}

async function runSearch(args: {
  andBase: Prisma.FsboListingWhereInput[];
  page: number;
  limit: number;
  green: { greenFilters?: GreenSearchFilters; sortMode?: GreenRankingSortMode; audience?: "public" | "internal" };
  /** Optional logged-in user: tiny city-alignment reorder after filters (additive). */
  personalizationUserId?: string | null;
}) {
  const and = [...args.andBase];
  if (isGreenFiltersActive(args.green.greenFilters)) {
    applyPrismaGreenHints(and, args.green.greenFilters);
  }
  const where: Prisma.FsboListingWhereInput = { AND: and };
  const skip = (args.page - 1) * args.limit;
  const [total, rowsRaw] = await Promise.all([
    prisma.fsboListing.count({ where }),
    prisma.fsboListing.findMany({
      where,
      orderBy: [
        { featuredUntil: { sort: "desc", nulls: "last" } },
        { updatedAt: "desc" },
      ],
      skip,
      take: args.limit,
      select: rankingSelect,
    }),
  ]);

  if (rowsRaw.length === 0) {
    return { data: [] as unknown[], total, page: args.page, limit: args.limit, hasMore: false };
  }

  let workRows: typeof rowsRaw = rowsRaw;
  if (isGreenFiltersActive(args.green.greenFilters)) {
    const dec = new Map(
      rowsRaw.map((r) => [r.id, decorateListingWithGreenSignals(r)] as const)
    );
    workRows = applyGreenSearchFilters(rowsRaw, args.green.greenFilters, dec) as typeof rowsRaw;
  }

  if (args.green.sortMode) {
    const dec = new Map(workRows.map((r) => [r.id, decorateListingWithGreenSignals(r)] as const));
    workRows = rankListingsWithGreenSignals({
      items: workRows,
      decorationById: dec,
      getId: (r) => r.id,
      getBaseScore: () => 0.5,
      sortMode: args.green.sortMode,
      audience: args.green.audience === "internal" ? "internal" : "public",
    }).ranked as typeof rowsRaw;
  }

  if (args.personalizationUserId?.trim()) {
    workRows = (await reorderListingsForWave13Personalization(
      workRows,
      args.personalizationUserId,
    )) as typeof rowsRaw;
  }

  const data = await buildResponse(workRows as FsboSelectRow[]);
  const inMemOnly =
    isGreenFiltersActive(args.green.greenFilters) && workRows.length < rowsRaw.length
      ? workRows.length
      : null;
  const hasMore = total > skip + rowsRaw.length; // same spirit as pre-green behaviour

  return {
    data,
    total: inMemOnly != null ? inMemOnly : total,
    page: args.page,
    limit: args.limit,
    hasMore: inMemOnly != null && inMemOnly < args.limit ? false : hasMore,
  };
}

function buildBaseAnd(
  request: { city: string; minPrice?: string; maxPrice?: string; bedrooms?: string; bathrooms?: string; propertyType?: string }
) {
  const and: Prisma.FsboListingWhereInput[] = [
    { status: "ACTIVE" },
    { moderationStatus: "APPROVED" },
  ];
  if (request.city) {
    and.push(fsboCityWhereFromParam(request.city));
  }
  if (request.minPrice) {
    const n = parseInt(request.minPrice, 10);
    if (Number.isFinite(n) && n >= 0) and.push({ priceCents: { gte: n * 100 } });
  }
  if (request.maxPrice) {
    const n = parseInt(request.maxPrice, 10);
    if (Number.isFinite(n) && n >= 0) and.push({ priceCents: { lte: n * 100 } });
  }
  if (request.bedrooms) {
    const n = parseInt(request.bedrooms, 10);
    if (Number.isFinite(n) && n >= 0) and.push({ bedrooms: { gte: n } });
  }
  if (request.bathrooms) {
    const n = parseInt(request.bathrooms, 10);
    if (Number.isFinite(n) && n >= 0) and.push({ bathrooms: { gte: n } });
  }
  const pt = request.propertyType?.trim() ?? "";
  if (pt) and.push({ propertyType: { equals: pt, mode: "insensitive" } });
  return and;
}

/**
 * GET /api/fsbo/search — public catalog + optional `minLecipmGreenScore` (number).
 * POST — JSON: same keys + `greenFilters`, `sortMode` (see README-GREEN-SEARCH-RANKING.md), `greenAudience`.
 */
export async function GET(request: NextRequest) {
  try {
    const personalizationUserId = await getSessionUserIdFromRequest(request).catch(() => null);
    const { searchParams } = new URL(request.url);
    const cityRaw = searchParams.get("city")?.trim() ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
    );
    const andBase = buildBaseAnd({
      city: cityRaw,
      minPrice: searchParams.get("minPrice") ?? undefined,
      maxPrice: searchParams.get("maxPrice") ?? undefined,
      bedrooms: searchParams.get("bedrooms") ?? undefined,
      bathrooms: searchParams.get("bathrooms") ?? undefined,
      propertyType: searchParams.get("propertyType") ?? undefined,
    });
    const mgs = searchParams.get("minLecipmGreenScore");
    const greenFilters: GreenSearchFilters | undefined =
      mgs != null && mgs !== ""
        ? (() => {
            const n = parseInt(mgs, 10);
            return Number.isFinite(n) ? { minimumQuebecScore: n } : undefined;
          })()
        : undefined;

    const result = await runSearch({
      andBase,
      page,
      limit,
      green: { greenFilters, audience: "public" },
      personalizationUserId,
    });
    return Response.json(result);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "FSBO search failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const raw = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const page = Math.max(1, parseInt(String(raw.page ?? "1"), 10) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(String(raw.limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
    );
    const andBase = buildBaseAnd({
      city: String(raw.city ?? "").trim(),
      minPrice: raw.minPrice != null ? String(raw.minPrice) : undefined,
      maxPrice: raw.maxPrice != null ? String(raw.maxPrice) : undefined,
      bedrooms: raw.bedrooms != null ? String(raw.bedrooms) : undefined,
      bathrooms: raw.bathrooms != null ? String(raw.bathrooms) : undefined,
      propertyType: typeof raw.propertyType === "string" ? raw.propertyType : undefined,
    });
    const gRaw = raw.greenFilters;
    const greenFilters =
      gRaw != null && typeof gRaw === "object" && !Array.isArray(gRaw) ? (gRaw as GreenSearchFilters) : undefined;
    const sm = raw.sortMode;
    const sortMode: GreenRankingSortMode | undefined =
      sm === "green_best_now" ||
      sm === "green_upgrade_potential" ||
      sm === "green_incentive_opportunity" ||
      sm === "standard_with_green_boost"
        ? (sm as GreenRankingSortMode)
        : undefined;
    const mgs2 = raw.minLecipmGreenScore;
    const merged: GreenSearchFilters = {
      ...(typeof mgs2 === "number" && Number.isFinite(mgs2) ? { minimumQuebecScore: mgs2 } : {}),
      ...(greenFilters ?? {}),
    };
    const effectiveFilters = isGreenFiltersActive(merged) ? merged : undefined;
    const result = await runSearch({
      andBase,
      page,
      limit,
      green: {
        greenFilters: effectiveFilters,
        sortMode,
        audience: raw.greenAudience === "internal" ? "internal" : "public",
      },
      personalizationUserId,
    });
    return Response.json(result);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "FSBO search failed" }, { status: 500 });
  }
}
