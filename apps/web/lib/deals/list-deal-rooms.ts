import type { DealPriorityLabel, DealRoomStage, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type ListDealRoomsFilters = {
  brokerUserId?: string;
  stage?: DealRoomStage;
  priorityLabel?: DealPriorityLabel;
  listingId?: string;
  /** Only rooms with nextFollowUpAt <= now + hours */
  followUpDueWithinHours?: number;
  archived?: boolean;
};

export async function listDealRooms(
  scope: { mode: "broker"; brokerUserId: string } | { mode: "admin" },
  filters: ListDealRoomsFilters = {},
  opts?: { take?: number }
) {
  const take = opts?.take ?? 200;
  const where: Prisma.DealRoomWhereInput = {};

  if (scope.mode === "broker") {
    where.brokerUserId = scope.brokerUserId;
  } else if (filters.brokerUserId) {
    where.brokerUserId = filters.brokerUserId;
  }

  if (filters.stage) {
    where.stage = filters.stage;
  }
  if (filters.priorityLabel) {
    where.priorityLabel = filters.priorityLabel;
  }
  if (filters.listingId) {
    where.listingId = filters.listingId;
  }
  if (filters.archived !== undefined) {
    where.isArchived = filters.archived;
  } else {
    where.isArchived = false;
  }
  if (filters.followUpDueWithinHours !== undefined) {
    const until = new Date(Date.now() + filters.followUpDueWithinHours * 60 * 60 * 1000);
    where.nextFollowUpAt = { lte: until };
  }

  return prisma.dealRoom.findMany({
    where,
    take,
    orderBy: [{ nextFollowUpAt: "asc" }, { updatedAt: "desc" }],
    include: {
      broker: { select: { id: true, name: true, email: true } },
      listing: { select: { id: true, title: true, listingCode: true, price: true } },
      lead: { select: { id: true, name: true, email: true, score: true, highIntent: true } },
      events: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}
