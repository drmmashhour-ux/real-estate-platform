import { prisma } from "@/lib/db";
import { isDealAnalyzerAlertsEnabled } from "@/modules/deal-analyzer/config";
import { evaluateWatchlistAlerts } from "@/modules/deal-analyzer/infrastructure/services/alertTriggerService";

export async function evaluatePortfolioAlertsForUser(userId: string) {
  if (!isDealAnalyzerAlertsEnabled()) {
    return { ok: false as const, error: "Deal Analyzer alerts are disabled" };
  }
  const wls = await prisma.dealWatchlist.findMany({ where: { ownerId: userId } });
  let total = 0;
  for (const w of wls) {
    const r = await evaluateWatchlistAlerts(w.id);
    total += r.created;
  }
  return { ok: true as const, alertsCreated: total };
}

export async function evaluatePortfolioAlertsForWatchlist(args: { userId: string; watchlistId: string }) {
  if (!isDealAnalyzerAlertsEnabled()) {
    return { ok: false as const, error: "Deal Analyzer alerts are disabled" };
  }
  const wl = await prisma.dealWatchlist.findFirst({
    where: { id: args.watchlistId, ownerId: args.userId },
  });
  if (!wl) return { ok: false as const, error: "Watchlist not found" };
  const r = await evaluateWatchlistAlerts(args.watchlistId);
  return { ok: true as const, alertsCreated: r.created };
}
