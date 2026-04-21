import { prisma } from "@/lib/db";
import {
  CONTRACTOR_WORK_DISCLAIMER,
  type ContractorProfilePublic,
  type ContractorReviewPublic,
  type MatchedContractor,
} from "./contractor.model";
import {
  overlapScore,
  regionMatchesContractor,
  upgradeRecommendationsToServiceTags,
} from "./contractor.matching";

function reviewToPublic(r: { id: string; rating: number; body: string | null; authorLabel: string | null; createdAt: Date }): ContractorReviewPublic {
  return {
    id: r.id,
    rating: r.rating,
    body: r.body,
    authorLabel: r.authorLabel,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function getContractorProfile(contractorId: string): Promise<ContractorProfilePublic | null> {
  const row = await prisma.contractor.findUnique({
    where: { id: contractorId },
    include: { reviews: { orderBy: { createdAt: "desc" }, take: 24 } },
  });
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    services: row.services,
    region: row.region,
    rating: row.rating,
    premiumListing: row.premiumListing,
    reviews: row.reviews.map(reviewToPublic),
  };
}

/**
 * Match contractors to upgrade recommendation strings + optional region (city/province).
 */
export async function matchContractorsForUpgrades(args: {
  upgradeRecommendations: string[];
  region?: string | null;
  limit?: number;
}): Promise<{ contractors: MatchedContractor[]; wantedTags: string[]; disclaimer: string }> {
  const tags = upgradeRecommendationsToServiceTags(args.upgradeRecommendations);
  const wanted = new Set(tags);
  const limit = Math.min(Math.max(args.limit ?? 12, 1), 40);

  const rows = await prisma.contractor.findMany({
    include: { reviews: { orderBy: { createdAt: "desc" }, take: 8 } },
  });

  const scored = rows
    .filter((c) => {
      if (!regionMatchesContractor(c.region, args.region)) return false;
      if (wanted.size === 0) return true;
      return overlapScore(c.services, wanted) > 0;
    })
    .map((c) => {
      const overlap = overlapScore(c.services, wanted);
      const reasons: string[] = [];
      if (overlap > 0) reasons.push(`Services overlap (${overlap} categories)`);
      else reasons.push("Regional listing — confirm fit");
      if (c.premiumListing) reasons.push("Premium placement");
      return {
        contractor: c,
        overlap,
        reasons,
      };
    })
    .sort((a, b) => {
      if (a.contractor.premiumListing !== b.contractor.premiumListing) return a.contractor.premiumListing ? -1 : 1;
      if (b.overlap !== a.overlap) return b.overlap - a.overlap;
      return b.contractor.rating - a.contractor.rating;
    })
    .slice(0, limit);

  const contractors: MatchedContractor[] = scored.map(({ contractor: c, reasons }) => ({
    id: c.id,
    name: c.name,
    services: c.services,
    region: c.region,
    rating: c.rating,
    premiumListing: c.premiumListing,
    reviews: c.reviews.map(reviewToPublic),
    matchReasons: reasons,
  }));

  return {
    contractors,
    wantedTags: tags,
    disclaimer: CONTRACTOR_WORK_DISCLAIMER,
  };
}

export async function createGreenQuoteRequest(args: {
  userId?: string | null;
  contractorId?: string | null;
  projectDescription: string;
  upgradeHints: string[];
  region?: string | null;
}) {
  return prisma.greenUpgradeQuoteRequest.create({
    data: {
      userId: args.userId ?? undefined,
      contractorId: args.contractorId ?? undefined,
      projectDescription: args.projectDescription.trim().slice(0, 8000),
      upgradeHints: args.upgradeHints.slice(0, 32),
      region: args.region?.slice(0, 128) ?? undefined,
    },
    select: { id: true, createdAt: true },
  });
}
