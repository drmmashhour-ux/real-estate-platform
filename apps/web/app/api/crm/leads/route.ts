import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBrokerOrAdminApi } from "@/modules/crm/services/require-broker-api";
import { recalculateLeadLecipmScores } from "@/modules/crm/application/recalculateLeadLecipmScores";
import { suggestAutoActions } from "@/modules/crm/application/suggestAutoActions";
import { getLeadIntelligence } from "@/modules/ai-core/application/leadIntelligenceService";

export const dynamic = "force-dynamic";

/**
 * GET /api/crm/leads — elite-scored leads for the broker (optionally rescore from engines).
 */
export async function GET(request: Request) {
  const gate = await requireBrokerOrAdminApi();
  if (!gate.ok) return gate.response;

  const url = new URL(request.url);
  const rescore = url.searchParams.get("rescore") === "1";
  const includeAi = url.searchParams.get("ai") === "1";
  const take = Math.min(100, Math.max(1, Number(url.searchParams.get("take") ?? "40") || 40));

  const scope =
    gate.session.role === "ADMIN"
      ? {}
      : {
          OR: [{ introducedByBrokerId: gate.session.id }, { lastFollowUpByBrokerId: gate.session.id }],
        };

  let leads = await prisma.lead.findMany({
    where: scope,
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  if (rescore) {
    for (const l of leads.slice(0, take)) {
      try {
        await recalculateLeadLecipmScores(prisma, l.id);
      } catch {
        /* skip bad rows */
      }
    }
    leads = await prisma.lead.findMany({
      where: scope,
      orderBy: { updatedAt: "desc" },
      take: 200,
    });
  }

  const sorted = [...leads].sort((a, b) => (b.lecipmLeadScore ?? -1) - (a.lecipmLeadScore ?? -1));

  const base = sorted.slice(0, take);
  const aiByLeadId = new Map<string, Awaited<ReturnType<typeof getLeadIntelligence>>>();
  if (includeAi) {
    for (const l of base) {
      aiByLeadId.set(l.id, await getLeadIntelligence(prisma, l.id));
    }
  }

  return NextResponse.json({
    leads: base.map((l) => ({
      id: l.id,
      name: l.name,
      email: l.email,
      phone: l.phone,
      fsboListingId: l.fsboListingId,
      lecipmLeadScore: l.lecipmLeadScore,
      lecipmDealQualityScore: l.lecipmDealQualityScore,
      lecipmTrustScore: l.lecipmTrustScore,
      lecipmUrgencyScore: l.lecipmUrgencyScore,
      lecipmCrmStage: l.lecipmCrmStage,
      score: l.score,
      pipelineStage: l.pipelineStage,
      createdAt: l.createdAt.toISOString(),
      suggestedActions: suggestAutoActions(l),
      aiInsights: includeAi ? aiByLeadId.get(l.id) : undefined,
    })),
  });
}
