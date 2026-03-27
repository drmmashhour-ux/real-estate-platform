import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isDealAnalyzerEnabled, isDealAnalyzerAlertsEnabled } from "@/modules/deal-analyzer/config";
import { evaluatePortfolioAlertsForWatchlist } from "@/modules/deal-analyzer/application/evaluatePortfolioAlerts";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isDealAnalyzerEnabled() || !isDealAnalyzerAlertsEnabled()) {
    return NextResponse.json({ error: "Deal Analyzer alerts disabled" }, { status: 503 });
  }
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;

  const out = await evaluatePortfolioAlertsForWatchlist({ userId, watchlistId: id });
  if (!out.ok) return NextResponse.json({ error: out.error }, { status: 404 });
  return NextResponse.json({ alertsCreated: out.alertsCreated });
}
