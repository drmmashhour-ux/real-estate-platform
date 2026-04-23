import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function addWatchlistItem(data: Prisma.MonitoringWatchlistItemCreateInput) {
  return prisma.monitoringWatchlistItem.create({ data });
}

export async function listWatchlist(ownerType: string, ownerId: string) {
  return prisma.monitoringWatchlistItem.findMany({
    where: { ownerType, ownerId },
    orderBy: { createdAt: "desc" },
  });
}

export async function removeWatchlistItem(id: string, ownerType: string, ownerId: string) {
  return prisma.monitoringWatchlistItem.deleteMany({
    where: { id, ownerType, ownerId },
  });
}
