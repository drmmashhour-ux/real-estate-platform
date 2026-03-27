import type { ReadinessLevel, TrustLevel } from "@prisma/client";

export type ListingTrustSnapshotDto = {
  trustLevel: TrustLevel | null;
  displayScore: number | null;
  readinessLevel: ReadinessLevel | null;
  publicBadgeLabels: string[];
  missingItemsCount: number;
  sellerActionRequired: boolean;
  recommendedActionsCount: number;
  lastVerifiedAt: string | null;
};

function publicBadgesForTrustLevel(tl: TrustLevel | null): string[] {
  if (!tl) return [];
  switch (tl) {
    case "verified":
      return ["Verified"];
    case "high":
      return ["High trust"];
    case "medium":
      return ["Standard"];
    case "low":
      return [];
    default:
      return [];
  }
}

/**
 * Seller-facing snapshot — no fraud signals, codes, or reviewer data.
 */
export function toListingTrustSnapshotDto(args: {
  caseRow: {
    overallScore: number | null;
    trustLevel: TrustLevel | null;
    readinessLevel: ReadinessLevel | null;
    updatedAt: Date;
    summary?: unknown;
  } | null;
  sellerFacingActionCount: number;
}): ListingTrustSnapshotDto {
  const summary = args.caseRow?.summary as { missingItems?: unknown } | null | undefined;
  const missingItems = Array.isArray(summary?.missingItems) ? (summary!.missingItems as unknown[]).filter((x) => typeof x === "string") : [];
  const readiness = args.caseRow?.readinessLevel ?? null;
  const sellerActionRequired =
    readiness === "action_required" ||
    readiness === "partial" ||
    missingItems.length > 0 ||
    args.sellerFacingActionCount > 0;

  return {
    trustLevel: args.caseRow?.trustLevel ?? null,
    displayScore: args.caseRow?.overallScore ?? null,
    readinessLevel: readiness,
    publicBadgeLabels: publicBadgesForTrustLevel(args.caseRow?.trustLevel ?? null),
    missingItemsCount: missingItems.length,
    sellerActionRequired,
    recommendedActionsCount: args.sellerFacingActionCount,
    lastVerifiedAt: args.caseRow ? args.caseRow.updatedAt.toISOString() : null,
  };
}
