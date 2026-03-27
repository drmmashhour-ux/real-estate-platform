import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isDealAnalyzerEnabled, isDealAnalyzerAlertsEnabled } from "@/modules/deal-analyzer/config";
import { listPortfolioAlertsForWatchlist } from "@/modules/deal-analyzer/application/listPortfolioAlerts";
import { mapPortfolioAlertRow } from "@/modules/deal-analyzer/infrastructure/mappers/phase3DtoMappers";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isDealAnalyzerEnabled() || !isDealAnalyzerAlertsEnabled()) {
    return NextResponse.json({ error: "Deal Analyzer alerts disabled" }, { status: 503 });
  }
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;

  const rows = await listPortfolioAlertsForWatchlist({ userId, watchlistId: id });
  if (rows === null) return NextResponse.json({ alerts: [] });
  return NextResponse.json({ alerts: rows.map(mapPortfolioAlertRow) });
}
