import { NextResponse } from "next/server";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { computeDealInvestorMatches } from "@/modules/deal-investor-match";

export const dynamic = "force-dynamic";

/**
 * GET — ranked investor matches with fit reasons and compliance blockers (broker assignee or admin).
 * Does not log audit (use POST …/refresh to record match_generated).
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;
  if (auth.deal.brokerId !== auth.userId && auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Assignee broker only" }, { status: 403 });
  }

  const matches = await computeDealInvestorMatches(dealId, 30);
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
