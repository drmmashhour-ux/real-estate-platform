import { prisma } from "@/lib/db";

export async function listAlertsForUser(userId: string) {
  return prisma.dealPortfolioAlert.findMany({
    where: { watchlist: { ownerId: userId } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function listAlertsForWatchlist(watchlistId: string, userId: string) {
  const wl = await prisma.dealWatchlist.findFirst({
    where: { id: watchlistId, ownerId: userId },
  });
  if (!wl) return null;
  return prisma.dealPortfolioAlert.findMany({
    where: { watchlistId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function dismissAlert(args: { alertId: string; userId: string }) {
  const alert = await prisma.dealPortfolioAlert.findFirst({
    where: { id: args.alertId },
    include: { watchlist: true },
  });
  if (!alert || alert.watchlist.ownerId !== args.userId) return null;
  return prisma.dealPortfolioAlert.update({
    where: { id: args.alertId },
    data: { status: "dismissed" },
  });
}

export async function markAlertRead(args: { alertId: string; userId: string }) {
  const alert = await prisma.dealPortfolioAlert.findFirst({
    where: { id: args.alertId },
    include: { watchlist: true },
  });
  if (!alert || alert.watchlist.ownerId !== args.userId) return null;
  return prisma.dealPortfolioAlert.update({
    where: { id: args.alertId },
    data: { status: "read" },
  });
}
