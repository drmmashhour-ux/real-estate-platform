import type { ReadinessLevel, TrustLevel } from "@prisma/client";
import { prisma } from "@/lib/db";
import { computeListingRankingResult, type ListingRankingResult } from "@/lib/trustgraph/domain/ranking";

export type FsboRankingRow = {
  id: string;
  featuredUntil: Date | null;
  updatedAt: Date;
  images?: unknown;
  sellerDeclarationJson?: unknown;
  sellerDeclarationCompletedAt?: Date | null;
};

export type ListingAugmentationPublic = {
  listingId: string;
  publicBadgeReasons: string[];
  trustBoostScore: number;
  finalRankingScore: number;
};

export type ListingRankingInternal = ListingRankingResult & { listingId: string };

function mediaCompleteness(images: unknown): number {
  const arr = Array.isArray(images) ? images : [];
  const n = arr.filter((x) => typeof x === "string" && (x as string).trim().length > 0).length;
  if (n >= 6) return 1;
  if (n >= 3) return 0.85;
  if (n >= 1) return 0.45;
  return 0;
}

function declarationCompleteness(
  sellerDeclarationJson: unknown,
  sellerDeclarationCompletedAt: Date | null | undefined
): number {
  if (sellerDeclarationCompletedAt) return 1;
  if (sellerDeclarationJson && typeof sellerDeclarationJson === "object" && sellerDeclarationJson !== null) {
    const keys = Object.keys(sellerDeclarationJson as object);
    if (keys.length >= 4) return 0.75;
    if (keys.length >= 1) return 0.35;
  }
  return 0;
}

function brokerVerificationCompleteness(): number {
  return 0;
}

/**
 * Loads latest LISTING verification case per id (most recent `updatedAt`).
 */
export async function loadLatestListingCasesForIds(
  listingIds: string[]
): Promise<Map<string, { trustLevel: TrustLevel | null; readinessLevel: ReadinessLevel | null; overallScore: number | null }>> {
  if (listingIds.length === 0) return new Map();
  const rows = await prisma.verificationCase.findMany({
    where: { entityType: "LISTING", entityId: { in: listingIds } },
    orderBy: { updatedAt: "desc" },
    select: {
      entityId: true,
      trustLevel: true,
      readinessLevel: true,
      overallScore: true,
    },
  });
  const m = new Map<string, { trustLevel: TrustLevel | null; readinessLevel: ReadinessLevel | null; overallScore: number | null }>();
  for (const r of rows) {
    if (!m.has(r.entityId)) {
      m.set(r.entityId, {
        trustLevel: r.trustLevel,
        readinessLevel: r.readinessLevel,
        overallScore: r.overallScore,
      });
    }
  }
  return m;
}

export function augmentRowsWithTrustRanking<T extends FsboRankingRow>(
  rows: T[],
  caseByListingId: Map<string, { trustLevel: TrustLevel | null; readinessLevel: ReadinessLevel | null; overallScore: number | null }>
): { sorted: T[]; augmentations: Map<string, ListingAugmentationPublic> } {
  const total = rows.length;
  const augmentations = new Map<string, ListingAugmentationPublic>();

  const scored = rows.map((row, index) => {
    const baseRankingScore = total > 0 ? (total - index) / total : 0;
    const c = caseByListingId.get(row.id);
    const result = computeListingRankingResult({
      baseRankingScore,
      trustLevel: c?.trustLevel ?? null,
      readinessLevel: c?.readinessLevel ?? null,
      mediaCompleteness: mediaCompleteness(row.images),
      declarationCompleteness: declarationCompleteness(row.sellerDeclarationJson, row.sellerDeclarationCompletedAt),
      brokerVerificationCompleteness: brokerVerificationCompleteness(),
    });
    augmentations.set(row.id, {
      listingId: row.id,
      publicBadgeReasons: result.publicBadgeReasons,
      trustBoostScore: result.trustBoostScore,
      finalRankingScore: result.finalRankingScore,
    });
    return { row, finalRankingScore: result.finalRankingScore };
  });

  scored.sort((a, b) => b.finalRankingScore - a.finalRankingScore || b.row.updatedAt.getTime() - a.row.updatedAt.getTime());

  return {
    sorted: scored.map((s) => s.row),
    augmentations,
  };
}

export function computeInternalRankingForListing(
  row: FsboRankingRow,
  index: number,
  total: number,
  caseRow: { trustLevel: TrustLevel | null; readinessLevel: ReadinessLevel | null } | undefined
): ListingRankingInternal {
  const baseRankingScore = total > 0 ? (total - index) / total : 0;
  const result = computeListingRankingResult({
    baseRankingScore,
    trustLevel: caseRow?.trustLevel ?? null,
    readinessLevel: caseRow?.readinessLevel ?? null,
    mediaCompleteness: mediaCompleteness(row.images),
    declarationCompleteness: declarationCompleteness(row.sellerDeclarationJson, row.sellerDeclarationCompletedAt),
    brokerVerificationCompleteness: brokerVerificationCompleteness(),
  });
  return { listingId: row.id, ...result };
}

/** Single-listing API (no search index context) — neutral base. */
export function computeRankingForSingleListing(args: {
  listing: FsboRankingRow;
  caseRow: { trustLevel: TrustLevel | null; readinessLevel: ReadinessLevel | null } | null;
}): ListingRankingInternal {
  const result = computeListingRankingResult({
    baseRankingScore: 0.5,
    trustLevel: args.caseRow?.trustLevel ?? null,
    readinessLevel: args.caseRow?.readinessLevel ?? null,
    mediaCompleteness: mediaCompleteness(args.listing.images),
    declarationCompleteness: declarationCompleteness(
      args.listing.sellerDeclarationJson,
      args.listing.sellerDeclarationCompletedAt
    ),
    brokerVerificationCompleteness: brokerVerificationCompleteness(),
  });
  return { listingId: args.listing.id, ...result };
}
