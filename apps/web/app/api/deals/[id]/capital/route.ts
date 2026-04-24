import { NextResponse } from "next/server";
import { authenticateDealParticipantRoute } from "@/lib/deals/execution-access";
import { getCapitalSummaryForDeal } from "@/modules/investment-flow/crm-deal-investment.service";

export const dynamic = "force-dynamic";

/**
 * GET — capital summary for deal participants and broker.
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: dealId } = await context.params;
  const auth = await authenticateDealParticipantRoute(dealId);
  if (!auth.ok) return auth.response;

  const summary = await getCapitalSummaryForDeal(dealId);
  return NextResponse.json({
    ok: true,
    dealId,
    ...summary,
    advisory:
      "Figures are operational records only. AMF / offering documents govern legal subscriptions and closings.",
  });
}
