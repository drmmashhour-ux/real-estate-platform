import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isDealAnalyzerEnabled, isDealAnalyzerAlertsEnabled } from "@/modules/deal-analyzer/config";
import { listPortfolioAlertsForUser } from "@/modules/deal-analyzer/application/listPortfolioAlerts";
import { mapPortfolioAlertRow } from "@/modules/deal-analyzer/infrastructure/mappers/phase3DtoMappers";

export const dynamic = "force-dynamic";

/** All alerts across the signed-in user’s watchlists (dashboard convenience). */
export async function GET() {
  if (!isDealAnalyzerEnabled() || !isDealAnalyzerAlertsEnabled()) {
    return NextResponse.json({ error: "Deal Analyzer alerts disabled" }, { status: 503 });
  }
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await listPortfolioAlertsForUser(userId);
  if (rows === null) return NextResponse.json({ alerts: [] });
  return NextResponse.json({ alerts: rows.map(mapPortfolioAlertRow) });
}
