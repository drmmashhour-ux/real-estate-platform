import { NextResponse } from "next/server";
import { requireBnhubInvestorPortalAccessApi } from "@/modules/investor/auth/require-bnhub-investor-portal-api";
import { loadBnhubInvestorRecommendationsView } from "@/modules/investment/investor-recommendations-view.service";

export const dynamic = "force-dynamic";

/**
 * GET — signed-in BNHub investor (`InvestorAccess` active): recommendations + portfolio summary for **their** listings only.
 * Never accepts arbitrary `scopeId` query params (scope is derived from session).
 */
export async function GET() {
  const gate = await requireBnhubInvestorPortalAccessApi();
  if (!gate.ok) return gate.response;

  const data = await loadBnhubInvestorRecommendationsView(gate.email);
  if (!data.ok) {
    return NextResponse.json({ success: false, error: "Unable to load investor recommendations." }, { status: 403 });
  }

  return NextResponse.json({
    success: true,
    recommendations: data.recommendations,
    summary: data.summary,
    listingCount: data.listingIds.length,
  });
}
