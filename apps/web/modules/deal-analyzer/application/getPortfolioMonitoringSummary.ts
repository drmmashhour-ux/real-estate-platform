import { prisma } from "@/lib/db";
import { isDealAnalyzerPortfolioMonitoringEnabled } from "@/modules/deal-analyzer/config";

export async function getPortfolioMonitoringSummary(args: { watchlistId: string; userId: string }) {
  if (!isDealAnalyzerPortfolioMonitoringEnabled()) return null;

  const wl = await prisma.dealWatchlist.findFirst({
    where: { id: args.watchlistId, ownerId: args.userId },
  });
  if (!wl) return null;

  const snapshot = await prisma.portfolioMonitoringSnapshot.findFirst({
    where: { watchlistId: args.watchlistId },
    orderBy: { createdAt: "desc" },
  });

  const events = await prisma.portfolioMonitoringEvent.findMany({
    where: { watchlistId: args.watchlistId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return { snapshot, events };
}
