import type { LecipmBrokerThreadStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { ThreadViewer } from "@/lib/messages/permissions";

export type ListThreadsFilters = {
  status?: LecipmBrokerThreadStatus | "all";
  unreadOnly?: boolean;
  listingId?: string | null;
};

export async function listLecipmBrokerThreads(
  viewer: Extract<ThreadViewer, { kind: "broker" | "customer" | "admin" }>,
  filters: ListThreadsFilters = {}
) {
  const uid = viewer.userId;
  const roleBase =
    viewer.kind === "broker" ? { brokerUserId: uid } : viewer.kind === "customer" ? { customerUserId: uid } : {};

  const statusWhere =
    filters.status && filters.status !== "all" ? { status: filters.status as LecipmBrokerThreadStatus } : {};

  const listingWhere = filters.listingId ? { listingId: filters.listingId } : {};

  const isBrokerSide = viewer.kind === "broker" || viewer.kind === "admin";
  const unreadSenderRoles = isBrokerSide ? (["customer", "guest"] as const) : (["broker", "admin"] as const);

  const unreadWhere = filters.unreadOnly
    ? {
        messages: {
          some: {
            senderRole: { in: [...unreadSenderRoles] },
            isRead: false,
          },
        },
      }
    : {};

  const threads = await prisma.lecipmBrokerListingThread.findMany({
    where: {
      ...roleBase,
      ...statusWhere,
      ...listingWhere,
      ...unreadWhere,
    },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
    include: {
      listing: { select: { id: true, title: true, listingCode: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const ids = threads.map((t) => t.id);
  const counts =
    ids.length === 0
      ? []
      : await prisma.lecipmBrokerListingMessage.groupBy({
          by: ["threadId"],
          where: {
            threadId: { in: ids },
            isRead: false,
            senderRole: { in: [...unreadSenderRoles] },
          },
          _count: { _all: true },
        });

  const unreadMap = new Map(counts.map((c) => [c.threadId, c._count._all]));

  return threads.map((t) => {
    const last = t.messages[0];
    return {
      id: t.id,
      status: t.status,
      source: t.source,
      subject: t.subject,
      lastMessageAt: t.lastMessageAt.toISOString(),
      listing: t.listing
        ? { id: t.listing.id, title: t.listing.title, listingCode: t.listing.listingCode }
        : null,
      guestName: t.guestName,
      customerUserId: t.customerUserId,
      preview: last ? last.body.slice(0, 160) : "",
      lastMessageRole: last?.senderRole ?? null,
      unreadCount: unreadMap.get(t.id) ?? 0,
    };
  });
}
