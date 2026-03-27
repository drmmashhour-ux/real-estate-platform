import { prisma } from "@/lib/db";
import { getPortfolioMonitoringSummary } from "@/modules/deal-analyzer/application/getPortfolioMonitoringSummary";
import { isDealAnalyzerPortfolioMonitoringEnabled } from "@/modules/deal-analyzer/config";
import type { CopilotBlock, PortfolioWeekItemDto } from "@/modules/copilot/domain/copilotTypes";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function runPortfolioWhatChanged(args: {
  userId: string;
  watchlistId: string | null;
}): Promise<
  { ok: true; block: CopilotBlock; summaryLine: string; usedDealAnalyzer: boolean } | { ok: false; error: string }
> {
  let wlId = args.watchlistId;
  if (!wlId) {
    const first = await prisma.dealWatchlist.findFirst({
      where: { ownerId: args.userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });
    wlId = first?.id ?? null;
  }

  if (!wlId) {
    return { ok: false, error: "No watchlist found — save listings to a watchlist first." };
  }

  const since = new Date(Date.now() - WEEK_MS);

  if (isDealAnalyzerPortfolioMonitoringEnabled()) {
    const data = await getPortfolioMonitoringSummary({ watchlistId: wlId, userId: args.userId });
    if (!data) {
      return { ok: false, error: "Watchlist not found" };
    }

    const recent = data.events.filter((e) => e.createdAt >= since);
    const dto: PortfolioWeekItemDto[] = recent.slice(0, 40).map((e) => ({
      eventType: e.eventType,
      severity: e.severity,
      title: e.title,
      message: e.message,
      propertyId: e.propertyId,
      createdAt: e.createdAt.toISOString(),
    }));

    const snap = data.snapshot?.summary;
    const summaryNote =
      snap && typeof snap === "object"
        ? (() => {
            const s = snap as Record<string, unknown>;
            return `Last snapshot: upgraded ${String(s.upgradedCount ?? 0)}, downgraded ${String(s.downgradedCount ?? 0)}, risk up ${String(s.trustDroppedCount ?? 0)}.`;
          })()
        : null;

    return {
      ok: true,
      block: {
        type: "portfolio_week",
        events: dto,
        summaryNote,
        queryNote: "Events come from the Deal Analyzer portfolio monitoring job (deterministic thresholds).",
      },
      summaryLine: `Portfolio activity (last ~7 days) for your watchlist — ${dto.length} event(s) in window.`,
      usedDealAnalyzer: true,
    };
  }

  const alerts = await prisma.dealPortfolioAlert.findMany({
    where: {
      watchlistId: wlId,
      updatedAt: { gte: since },
    },
    orderBy: { updatedAt: "desc" },
    take: 40,
  });

  const dto: PortfolioWeekItemDto[] = alerts.map((a) => ({
    eventType: a.alertType,
    severity: a.severity,
    title: a.title,
    message: a.message,
    propertyId: a.propertyId,
    createdAt: a.updatedAt.toISOString(),
  }));

  return {
    ok: true,
    block: {
      type: "portfolio_week",
      events: dto,
      summaryNote: null,
      queryNote: "Phase 4 monitoring disabled — showing watchlist alerts from the last 7 days instead.",
    },
    summaryLine: `Watchlist activity (last ~7 days) — ${dto.length} alert row(s).`,
    usedDealAnalyzer: false,
  };
}
