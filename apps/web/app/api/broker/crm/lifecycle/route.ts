import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { computeBrokerLifecycleInsights } from "@/lib/ai/lifecycle/insights";
import { suggestNextLeadActions } from "@/lib/ai/lifecycle/lead-actions";
import { suggestDealActions } from "@/lib/ai/lifecycle/deal-actions";
import { RETENTION_TEMPLATES } from "@/lib/ai/lifecycle/retention-templates";
import { enrichLeadForBrokerDashboard } from "@/lib/ai/merge-lead-display";

export const dynamic = "force-dynamic";

const CRM_STAGES = [
  "new",
  "contacted",
  "visit_scheduled",
  "offer_made",
  "negotiation",
  "accepted",
  "closed",
  "lost",
] as const;

/**
 * GET /api/broker/crm/lifecycle — hot leads, active deals, retention due, AI suggestions (broker/admin).
 */
export async function GET(_request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "BROKER" && user?.role !== "ADMIN") {
    return Response.json({ error: "Broker access only" }, { status: 403 });
  }

  const insights = await computeBrokerLifecycleInsights(userId, {
    adminView: user?.role === "ADMIN",
  });

  const leadWhere =
    user?.role === "ADMIN"
      ? {}
      : {
          OR: [{ introducedByBrokerId: userId }, { lastFollowUpByBrokerId: userId }],
        };

  const leads = await prisma.lead.findMany({
    where: leadWhere,
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  const hotLeads = [];
  for (const l of leads) {
    const ai = await enrichLeadForBrokerDashboard({
      id: l.id,
      email: l.email,
      score: l.score,
      createdAt: l.createdAt,
      lastFollowUpAt: l.lastFollowUpAt,
      userId: l.userId,
    });
    const tier = l.aiTier || ai.temperature;
    if (tier === "hot") {
      hotLeads.push({
        id: l.id,
        name: l.name,
        score: ai.score,
        tier,
        source: l.leadSource ?? "unknown",
        status: l.status,
        suggestedActions: suggestNextLeadActions({
          status: l.status,
          score: ai.score,
          aiTier: tier,
          lastFollowUpAt: l.lastFollowUpAt,
          createdAt: l.createdAt,
        }),
      });
    }
  }

  const deals = await prisma.deal.findMany({
    where: user?.role === "ADMIN" ? {} : { brokerId: userId },
    orderBy: { updatedAt: "desc" },
    take: 25,
    include: {
      buyer: { select: { name: true, email: true } },
      seller: { select: { name: true, email: true } },
    },
  });

  const activeDeals = deals
    .filter((d) => d.status !== "closed" && d.status !== "cancelled")
    .map((d) => ({
      id: d.id,
      status: d.status,
      crmStage: d.crmStage,
      priceCents: d.priceCents,
      buyer: d.buyer.name,
      seller: d.seller.name,
      suggestedActions: suggestDealActions({ status: d.status, crmStage: d.crmStage }),
    }));

  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const retentionRows = await prisma.clientRetentionTouchpoint.findMany({
    where: {
      ...(user?.role === "ADMIN" ? {} : { brokerId: userId }),
      status: "pending",
      scheduledFor: { lte: nextWeek },
    },
    include: { lead: { select: { id: true, name: true, email: true } } },
    orderBy: { scheduledFor: "asc" },
    take: 20,
  });

  const followUps = retentionRows.map((r) => ({
    id: r.id,
    leadId: r.leadId,
    leadName: r.lead.name,
    scheduledFor: r.scheduledFor.toISOString(),
    templateKey: r.templateKey,
    draft: RETENTION_TEMPLATES[r.templateKey as keyof typeof RETENTION_TEMPLATES] ?? null,
  }));

  return Response.json({
    insights,
    hotLeads,
    activeDeals,
    retentionFollowUps: followUps,
    complianceReminder:
      "AI suggests actions only — it does not negotiate, give legal advice, or act as a licensed broker.",
    crmStages: CRM_STAGES,
  });
}
