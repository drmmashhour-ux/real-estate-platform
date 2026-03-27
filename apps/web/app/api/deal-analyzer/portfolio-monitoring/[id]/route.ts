import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isDealAnalyzerEnabled, isDealAnalyzerPortfolioMonitoringEnabled } from "@/modules/deal-analyzer/config";
import { getPortfolioMonitoringSummary } from "@/modules/deal-analyzer/application/getPortfolioMonitoringSummary";
import {
  mapMonitoringSummaryJson,
  mapPortfolioMonitoringEventRow,
} from "@/modules/deal-analyzer/infrastructure/mappers/phase4DtoMappers";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isDealAnalyzerEnabled() || !isDealAnalyzerPortfolioMonitoringEnabled()) {
    return NextResponse.json({ error: "Portfolio monitoring disabled" }, { status: 503 });
  }
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: watchlistId } = await context.params;

  const data = await getPortfolioMonitoringSummary({ watchlistId, userId });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const summaryDto = data.snapshot ? mapMonitoringSummaryJson(data.snapshot.summary) : null;
  return NextResponse.json({
    summary: summaryDto,
    events: data.events.map(mapPortfolioMonitoringEventRow),
  });
}
