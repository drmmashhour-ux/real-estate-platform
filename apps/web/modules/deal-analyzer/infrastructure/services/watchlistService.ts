import { prisma } from "@/lib/db";

export async function createWatchlistForUser(args: { userId: string; name: string }) {
  return prisma.dealWatchlist.create({
    data: {
      ownerType: "user",
      ownerId: args.userId,
      name: args.name.trim().slice(0, 120),
    },
  });
}

export async function updateWatchlistName(args: { watchlistId: string; userId: string; name: string }) {
  return prisma.dealWatchlist.updateMany({
    where: { id: args.watchlistId, ownerId: args.userId },
    data: { name: args.name.trim().slice(0, 120) },
  });
}

export async function listWatchlistsForUser(userId: string) {
  return prisma.dealWatchlist.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { items: true } } },
  });
}

export async function addPropertyToWatchlist(args: {
  watchlistId: string;
  userId: string;
  propertyId: string;
}) {
  const wl = await prisma.dealWatchlist.findFirst({
    where: { id: args.watchlistId, ownerId: args.userId },
  });
  if (!wl) return null;
  return prisma.dealWatchlistItem.upsert({
    where: {
      watchlistId_propertyId: { watchlistId: args.watchlistId, propertyId: args.propertyId },
    },
    create: {
      watchlistId: args.watchlistId,
      propertyId: args.propertyId,
    },
    update: {},
  });
}
