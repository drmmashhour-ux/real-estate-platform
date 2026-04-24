import { NextResponse } from "next/server";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import {
  computeDealInvestorMatches,
  recordDealInvestorMatchLearning,
  recordInvestorMatchAudit,
} from "@/modules/deal-investor-match";

export const dynamic = "force-dynamic";

/**
 * POST — recompute ranking and append [investor-match-ai] audit + learning signals (no outbound send).
 */
export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;
  if (auth.deal.brokerId !== auth.userId && auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Assignee broker only" }, { status: 403 });
  }

  const matches = await computeDealInvestorMatches(dealId, 30);

  await recordInvestorMatchAudit({
    dealId,
    actorUserId: auth.userId,
    action: "match_generated",
    metadata: {
      count: matches.length,
      top: matches.slice(0, 15).map((m) => ({ investorId: m.investorId, score: m.score })),
    },
  });

  for (const m of matches.slice(0, 20)) {
    await recordDealInvestorMatchLearning({
      dealId,
      investorId: m.investorId,
      eventType: "INVESTOR_MATCHED",
      metadata: { score: m.score, complianceOk: m.complianceOk },
    });
  }

  return NextResponse.json({
    ok: true,
    investorMatchAi: true,
    matches: matches.map((m) => ({
      investorId: m.investorId,
      score: m.score,
      fitReasons: m.fitReasons,
      penalties: m.penalties,
      complianceOk: m.complianceOk,
      complianceBlockers: m.complianceBlockers,
      canPreparePrivatePacket: m.complianceOk,
    })),
  });
}
