import { prisma } from "@/lib/db";
import { appendGrowthAuditLog } from "./growthAuditService";
import { getReadinessBreakdown } from "./listingReadinessService";

export async function generateRecommendationsForListing(listingId: string) {
  const b = await getReadinessBreakdown(listingId);
  if (!b) return null;
  if (b.blockers.length === 0) return null;
  return prisma.bnhubGrowthEngineRecommendation.create({
    data: {
      listingId,
      recommendationType: "LANDING_FIX",
      priority: "MEDIUM",
      title: "Listing growth blockers",
      description: `Resolve: ${b.blockers.join(", ")}`,
      actionPayloadJson: { listingId, blockers: b.blockers },
    },
  });
}

export async function generateRecommendationsForCampaign(campaignId: string) {
  const c = await prisma.bnhubGrowthCampaign.findUnique({
    where: { id: campaignId },
    select: { listingId: true },
  });
  if (!c) return null;
  return generateRecommendationsForListing(c.listingId);
}

export async function dismissRecommendation(id: string) {
  const row = await prisma.bnhubGrowthEngineRecommendation.update({
    where: { id },
    data: { status: "DISMISSED" },
  });
  await appendGrowthAuditLog({
    actorType: "ADMIN",
    entityType: "bnhub_growth_recommendation",
    entityId: id,
    actionType: "dismiss",
    actionSummary: "Recommendation dismissed",
  });
  return row;
}

export async function applyRecommendation(id: string, actorId?: string | null) {
  const row = await prisma.bnhubGrowthEngineRecommendation.update({
    where: { id },
    data: { status: "APPLIED" },
  });
  await appendGrowthAuditLog({
    actorType: "ADMIN",
    entityType: "bnhub_growth_recommendation",
    entityId: id,
    actorId,
    actionType: "apply",
    actionSummary: "Recommendation marked applied (execute side effects separately)",
  });
  return row;
}
