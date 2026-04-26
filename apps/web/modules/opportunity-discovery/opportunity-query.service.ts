import type {
  LecipmOpportunityCandidateStatus,
  LecipmOpportunityKind,
  LecipmOpportunityRiskTier,
  Prisma,
} from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export type OpportunityListFilters = {
  city?: string;
  propertyType?: string;
  marketSegment?: string;
  opportunityType?: LecipmOpportunityKind;
  minScore?: number;
  maxScore?: number;
  riskLevel?: LecipmOpportunityRiskTier;
  esgRelevant?: boolean;
  investorReady?: boolean;
  status?: LecipmOpportunityCandidateStatus | LecipmOpportunityCandidateStatus[];
  limit?: number;
};

export async function listStoredOpportunities(brokerUserId: string, filters: OpportunityListFilters = {}) {
  const where: Prisma.LecipmOpportunityCandidateWhereInput = {
    brokerUserId,
  };

  if (filters.city) where.city = { contains: filters.city, mode: "insensitive" };
  if (filters.propertyType) where.propertyType = filters.propertyType;
  if (filters.marketSegment) where.marketSegment = filters.marketSegment;
  if (filters.opportunityType) where.opportunityType = filters.opportunityType;
  if (filters.minScore != null || filters.maxScore != null) {
    where.score = {
      ...(filters.minScore != null ? { gte: filters.minScore } : {}),
      ...(filters.maxScore != null ? { lte: filters.maxScore } : {}),
    };
  }
  if (filters.riskLevel) where.riskLevel = filters.riskLevel;
  if (filters.esgRelevant === true) where.esgRelevant = true;
  if (filters.investorReady === true) where.investorReady = true;
  if (filters.status) {
    where.status = Array.isArray(filters.status) ? { in: filters.status } : filters.status;
  }

  const limit = Math.min(filters.limit ?? 120, 300);

  return prisma.lecipmOpportunityCandidate.findMany({
    where,
    orderBy: [{ score: "desc" }, { discoveredAt: "desc" }],
    take: limit,
  });
}

export async function topStoredOpportunities(brokerUserId: string, take = 24) {
  return prisma.lecipmOpportunityCandidate.findMany({
    where: { brokerUserId, status: { in: ["NEW", "REVIEWED", "ACTIONED"] } },
    orderBy: [{ score: "desc" }],
    take,
  });
}

export type { LecipmDiscoveryEntityType } from "@prisma/client";
