import { prisma } from "@/lib/db";

export async function getOrCreateDefaultWatchlist(userId: string) {
  const existing = await prisma.watchlist.findFirst({ where: { userId }, orderBy: { createdAt: "asc" } });
  if (existing) return existing;
  return prisma.watchlist.create({ data: { userId, name: "My Watchlist" } });
}

export async function addListingToWatchlist(args: { userId: string; listingId: string }) {
  const watchlist = await getOrCreateDefaultWatchlist(args.userId);
  const exists = await prisma.watchlistItem.findUnique({
    where: { watchlistId_listingId: { watchlistId: watchlist.id, listingId: args.listingId } },
  });
  if (exists) return { watchlist, item: exists, created: false };
  const item = await prisma.watchlistItem.create({ data: { watchlistId: watchlist.id, listingId: args.listingId } });
  return { watchlist, item, created: true };
}

export async function removeListingFromWatchlist(args: { userId: string; listingId: string }) {
  const watchlist = await getOrCreateDefaultWatchlist(args.userId);
  const removed = await prisma.watchlistItem.deleteMany({
    where: { watchlistId: watchlist.id, listingId: args.listingId },
  });
  return { removedCount: removed.count };
}

export async function listWatchlistItems(userId: string) {
  const watchlist = await getOrCreateDefaultWatchlist(userId);
  const items = await prisma.watchlistItem.findMany({
    where: { watchlistId: watchlist.id },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          city: true,
          priceCents: true,
          images: true,
          trustScore: true,
          riskScore: true,
          status: true,
          listingDealType: true,
          updatedAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return { watchlist, items };
}

export async function getLatestWatchlistSnapshot(args: { userId: string; listingId: string }) {
  return prisma.watchlistSnapshot.findFirst({
    where: { userId: args.userId, listingId: args.listingId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createWatchlistSnapshot(args: {
  userId: string;
  listingId: string;
  dealScore: number | null;
  trustScore: number | null;
  fraudScore: number | null;
  confidence: number | null;
  recommendation: string | null;
  price: number | null;
  listingStatus: string | null;
}) {
  return prisma.watchlistSnapshot.create({ data: args });
}

export async function listAlerts(args: { userId: string; limit?: number }) {
  return prisma.watchlistAlert.findMany({
    where: { userId: args.userId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: args.limit ?? 50,
  });
}

export async function markAlertRead(args: { userId: string; alertId: string }) {
  return prisma.watchlistAlert.updateMany({
    where: { id: args.alertId, userId: args.userId },
    data: { status: "read" },
  });
}

export async function dismissAlert(args: { userId: string; alertId: string }) {
  return prisma.watchlistAlert.updateMany({
    where: { id: args.alertId, userId: args.userId },
    data: { status: "dismissed" },
  });
}
