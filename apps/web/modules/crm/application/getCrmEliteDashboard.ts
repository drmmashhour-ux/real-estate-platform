import type { PrismaClient } from "@prisma/client";
import { suggestAutoActions } from "./suggestAutoActions";

export async function getCrmEliteDashboard(
  db: PrismaClient,
  brokerUserId: string,
  options: { adminView?: boolean } = {},
) {
  const scope = options.adminView
    ? {}
    : {
        OR: [{ introducedByBrokerId: brokerUserId }, { lastFollowUpByBrokerId: brokerUserId }],
      };

  const leads = await db.lead.findMany({
    where: scope,
    orderBy: { updatedAt: "desc" },
    take: 120,
  });

  const sorted = [...leads].sort((a, b) => (b.lecipmLeadScore ?? -1) - (a.lecipmLeadScore ?? -1));

  const topLeads = sorted.slice(0, 12).map((l) => ({
    id: l.id,
    name: l.name,
    email: l.email,
    lecipmLeadScore: l.lecipmLeadScore,
    lecipmTrustScore: l.lecipmTrustScore,
    lecipmDealQualityScore: l.lecipmDealQualityScore,
    lecipmUrgencyScore: l.lecipmUrgencyScore,
    lecipmCrmStage: l.lecipmCrmStage,
    fsboListingId: l.fsboListingId,
    createdAt: l.createdAt.toISOString(),
    suggestedActions: suggestAutoActions(l),
  }));

  const bestDeals = sorted
    .filter((l) => (l.lecipmDealQualityScore ?? 0) >= 65)
    .slice(0, 8)
    .map((l) => ({ id: l.id, name: l.name, dealQuality: l.lecipmDealQualityScore, listingId: l.fsboListingId }));

  const atRisk = sorted
    .filter((l) => (l.lecipmTrustScore ?? 100) < 45 && l.fsboListingId)
    .slice(0, 8)
    .map((l) => ({ id: l.id, name: l.name, trust: l.lecipmTrustScore, listingId: l.fsboListingId }));

  const stages = ["new_lead", "contacted", "qualified", "visit_scheduled", "offer_made", "closed"] as const;
  const byStage: Record<string, number> = {};
  for (const s of stages) byStage[s] = 0;
  for (const l of leads) {
    const st = l.lecipmCrmStage ?? "new_lead";
    if (st in byStage) byStage[st]++;
  }

  const closed = leads.filter((l) => l.lecipmCrmStage === "closed").length;
  const conversionRate = leads.length ? closed / leads.length : 0;

  return {
    topLeads,
    bestDeals,
    dealsAtRisk: atRisk,
    pipelineCounts: byStage,
    conversion: {
      total: leads.length,
      closed,
      conversionRate,
    },
  };
}
