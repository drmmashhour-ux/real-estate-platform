import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { enrichLeadForBrokerDashboard } from "@/lib/ai/merge-lead-display";
import { tierFromScore } from "@/lib/ai/lead-tier";

export const dynamic = "force-dynamic";

/**
 * GET /api/broker/ai/leads-dashboard — broker-scoped leads with AI score, tier, actions.
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

  const where =
    user?.role === "ADMIN"
      ? {}
      : {
          OR: [{ introducedByBrokerId: userId }, { lastFollowUpByBrokerId: userId }],
        };

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 60,
    include: {
      introducedByBroker: { select: { id: true, name: true } },
    },
  });

  const enriched = await Promise.all(
    leads.map(async (l) => {
      const ai = await enrichLeadForBrokerDashboard({
        id: l.id,
        email: l.email,
        score: l.score,
        createdAt: l.createdAt,
        lastFollowUpAt: l.lastFollowUpAt,
        userId: l.userId,
      });
      return {
        id: l.id,
        name: l.name,
        email: l.contactUnlockedAt ? l.email : "[Locked]",
        phone: l.contactUnlockedAt ? l.phone : "[Locked]",
        message: l.message,
        listingId: l.listingId,
        listingCode: l.listingCode,
        projectId: l.projectId,
        status: l.status,
        isLocked: !l.contactUnlockedAt,
        introducedByBroker: l.introducedByBroker,
        ...ai,
      };
    })
  );

  enriched.sort((a, b) => b.score - a.score);

  const hot = enriched.filter((x) => tierFromScore(x.score) === "hot").slice(0, 12);
  const warm = enriched.filter((x) => tierFromScore(x.score) === "warm").slice(0, 12);
  const cold = enriched.filter((x) => tierFromScore(x.score) === "cold").slice(0, 12);

  const tierSummary = {
    hot: enriched.filter((x) => x.temperature === "hot").length,
    warm: enriched.filter((x) => x.temperature === "warm").length,
    cold: enriched.filter((x) => x.temperature === "cold").length,
  };

  const recentActivity = enriched.slice(0, 15).map((x) => ({
    leadId: x.id,
    name: x.name,
    score: x.score,
    tier: x.temperature,
    tierEmoji: x.temperatureEmoji,
    suggestedNext: x.recommendedActions[0] ?? "Review lead",
    listingCode: x.listingCode ?? null,
    listingId: x.listingId ?? null,
  }));

  return Response.json({
    leads: enriched,
    hotLeads: hot,
    warmLeads: warm,
    coldLeads: cold,
    tierSummary,
    recentActivity,
    scoringRules: {
      windowDays: 30,
      tiers: [
        { name: "hot", minScore: 80, emoji: "🔥" },
        { name: "warm", minScore: 50, emoji: "🌡️" },
        { name: "cold", minScore: 0, emoji: "❄️" },
      ],
      signals: ["search_frequency", "listing_views", "saved_listings", "messages_sent", "repeat_visits", "time_on_site"],
    },
    disclaimer: "Scores are rule-based and explainable — not ML predictions. Validate with your CRM process.",
  });
}
