import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isDealAnalyzerEnabled, isDealAnalyzerPortfolioMonitoringEnabled } from "@/modules/deal-analyzer/config";
import { monitorInvestorPortfolio } from "@/modules/deal-analyzer/application/monitorInvestorPortfolio";
import { mapMonitoringSummaryJson } from "@/modules/deal-analyzer/infrastructure/mappers/phase4DtoMappers";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isDealAnalyzerEnabled() || !isDealAnalyzerPortfolioMonitoringEnabled()) {
    return NextResponse.json({ error: "Portfolio monitoring disabled" }, { status: 503 });
  }
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: watchlistId } = await context.params;

  const out = await monitorInvestorPortfolio({ watchlistId, userId });
  if (!out.ok) return NextResponse.json({ error: out.error }, { status: 404 });

  const summaryDto = mapMonitoringSummaryJson(out.summary);
  return NextResponse.json({ summary: summaryDto });
}
