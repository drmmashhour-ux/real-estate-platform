/**
 * Regulatory Compliance Defense – requirements registry, compliance reviews, status tracking.
 * Multi-market; connects with listings, users, bookings, payouts, markets.
 */
import { prisma } from "@/lib/db";

/** Create or update a compliance requirement for a market. */
export async function upsertComplianceRequirement(params: {
  marketId: string;
  requirementKey: string;
  name: string;
  description?: string;
  active?: boolean;
}) {
  const existing = await prisma.complianceRequirement.findFirst({
    where: { marketId: params.marketId, requirementKey: params.requirementKey },
  });
  const data = {
    name: params.name,
    description: params.description,
    active: params.active ?? true,
  };
  if (existing) {
    return prisma.complianceRequirement.update({
      where: { id: existing.id },
      data,
    });
  }
  return prisma.complianceRequirement.create({
    data: {
      marketId: params.marketId,
      requirementKey: params.requirementKey,
      ...data,
    },
  });
}

/** Get compliance requirements for a market. */
export async function getComplianceRequirements(marketId: string) {
  return prisma.complianceRequirement.findMany({
    where: { marketId, active: true },
  });
}

/** Create or update a compliance review for an entity (user, listing, booking). */
export async function upsertComplianceReview(params: {
  entityType: string;
  entityId: string;
  marketId?: string;
  status: string;
  requirementId?: string;
  reviewedBy?: string;
  notes?: string;
  documentRefs?: string[];
}) {
  const existing = await prisma.complianceReview.findFirst({
    where: { entityType: params.entityType, entityId: params.entityId },
    orderBy: { updatedAt: "desc" },
  });
  const data = {
    requirementId: params.requirementId,
    marketId: params.marketId,
    status: params.status,
    reviewedAt: params.reviewedBy ? new Date() : undefined,
    reviewedBy: params.reviewedBy,
    notes: params.notes,
    documentRefs: params.documentRefs ?? [],
  };
  if (existing) {
    return prisma.complianceReview.update({
      where: { id: existing.id },
      data: { ...data, updatedAt: new Date() },
    });
  }
  return prisma.complianceReview.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      ...data,
    },
  });
}

/** Get compliance review for entity. */
export async function getComplianceReview(entityType: string, entityId: string) {
  return prisma.complianceReview.findFirst({
    where: { entityType, entityId },
    orderBy: { updatedAt: "desc" },
  });
}

/** Get compliance review queue (pending / non-compliant) for internal dashboard. */
export async function getComplianceReviewQueue(params: {
  status?: string;
  marketId?: string;
  limit?: number;
}) {
  const where: Record<string, unknown> = {};
  if (params.status) where.status = params.status;
  if (params.marketId) where.marketId = params.marketId;
  return prisma.complianceReview.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: params.limit ?? 100,
  });
}
