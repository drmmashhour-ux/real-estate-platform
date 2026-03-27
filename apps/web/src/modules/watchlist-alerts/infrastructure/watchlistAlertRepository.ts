import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { WatchlistAlertInput } from "@/src/modules/watchlist-alerts/domain/watchlistAlert.types";

export async function createWatchlistAlert(input: WatchlistAlertInput) {
  return prisma.watchlistAlert.create({
    data: {
      userId: input.userId,
      watchlistId: input.watchlistId,
      listingId: input.listingId,
      alertType: input.alertType,
      severity: input.severity,
      title: input.title,
      message: input.message,
      metadata: input.metadata as Prisma.InputJsonValue,
      status: "unread",
    },
  });
}

export async function listWatchlistAlerts(args: { userId: string; limit?: number }) {
  return prisma.watchlistAlert.findMany({
    where: { userId: args.userId },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          city: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: args.limit ?? 100,
  });
}

export async function findRecentSimilarAlert(args: {
  userId: string;
  listingId: string;
  alertType: string;
  signature: string;
  since: Date;
}) {
  return prisma.watchlistAlert.findFirst({
    where: {
      userId: args.userId,
      listingId: args.listingId,
      alertType: args.alertType as any,
      createdAt: { gte: args.since },
      metadata: { path: ["signature"], equals: args.signature },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function markWatchlistAlertReadRow(args: { userId: string; alertId: string }) {
  return prisma.watchlistAlert.updateMany({
    where: { id: args.alertId, userId: args.userId },
    data: { status: "read" },
  });
}

export async function dismissWatchlistAlertRow(args: { userId: string; alertId: string }) {
  return prisma.watchlistAlert.updateMany({
    where: { id: args.alertId, userId: args.userId },
    data: { status: "dismissed" },
  });
}
