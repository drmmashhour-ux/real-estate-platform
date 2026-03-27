import type { PrismaClient } from "@prisma/client";

export async function buildCrmTrainingDataset(db: PrismaClient, limit = 500) {
  const leads = await db.lead.findMany({
    orderBy: { updatedAt: "desc" },
    take: Math.min(2000, Math.max(10, limit)),
    select: {
      id: true,
      source: true,
      pipelineStage: true,
      lecipmLeadScore: true,
      lecipmDealQualityScore: true,
      lecipmTrustScore: true,
      engagementScore: true,
      highIntent: true,
      createdAt: true,
      wonAt: true,
      lostAt: true,
      lecipmCrmStage: true,
    },
  });

  return leads.map((l) => ({
    leadId: l.id,
    features: {
      source: l.source ?? "unknown",
      leadScore: l.lecipmLeadScore ?? 50,
      dealScore: l.lecipmDealQualityScore ?? 50,
      trustScore: l.lecipmTrustScore ?? 50,
      engagementScore: l.engagementScore,
      highIntent: l.highIntent,
      stage: l.lecipmCrmStage ?? l.pipelineStage,
    },
    label: {
      converted: Boolean(l.wonAt),
      lost: Boolean(l.lostAt),
      timeToOutcomeDays:
        l.wonAt || l.lostAt
          ? Math.round(((l.wonAt ?? l.lostAt)!.getTime() - l.createdAt.getTime()) / (1000 * 60 * 60 * 24))
          : null,
    },
  }));
}
