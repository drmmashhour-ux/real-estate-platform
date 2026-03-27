import { prisma } from "@/lib/db";
import type { WatchlistSnapshotState } from "@/src/modules/watchlist-alerts/domain/watchlistSnapshot.types";

export async function createWatchlistSnapshotRow(args: {
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

export async function getLatestWatchlistSnapshotRow(args: { userId: string; listingId: string }) {
  return prisma.watchlistSnapshot.findFirst({
    where: { userId: args.userId, listingId: args.listingId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getLatestTwoWatchlistSnapshots(args: { userId: string; listingId: string }) {
  return prisma.watchlistSnapshot.findMany({
    where: { userId: args.userId, listingId: args.listingId },
    orderBy: { createdAt: "desc" },
    take: 2,
  });
}

export function toSnapshotState(row: {
  id: string;
  userId: string;
  listingId: string;
  dealScore: number | null;
  trustScore: number | null;
  fraudScore: number | null;
  confidence: number | null;
  recommendation: string | null;
  price: number | null;
  listingStatus: string | null;
  createdAt: Date;
}): WatchlistSnapshotState {
  return { ...row };
}
