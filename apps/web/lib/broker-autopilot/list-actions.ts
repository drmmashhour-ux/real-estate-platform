import type { LecipmBrokerAutopilotActionStatus, LecipmBrokerAutopilotActionType } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function listOpenAutopilotActions(opts: {
  brokerUserId: string;
  isAdmin: boolean;
  take?: number;
}) {
  const take = opts.take ?? 100;
  const now = new Date();
  const base = opts.isAdmin ? {} : { brokerUserId: opts.brokerUserId };

  return prisma.lecipmBrokerAutopilotAction.findMany({
    where: {
      ...base,
      status: { in: ["suggested", "queued", "approved"] },
      OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: now } }],
    },
    orderBy: [{ updatedAt: "desc" }],
    take,
    include: {
      lead: {
        select: {
          id: true,
          guestName: true,
          guestEmail: true,
          status: true,
          threadId: true,
          customer: { select: { name: true, email: true } },
          listing: { select: { id: true, title: true, listingCode: true } },
        },
      },
    },
  });
}

export async function listAutopilotActions(opts: {
  brokerUserId: string;
  isAdmin: boolean;
  status?: LecipmBrokerAutopilotActionStatus | LecipmBrokerAutopilotActionStatus[];
  take?: number;
}) {
  const take = opts.take ?? 200;
  const base = opts.isAdmin ? {} : { brokerUserId: opts.brokerUserId };
  const statusFilter =
    opts.status === undefined
      ? {}
      : Array.isArray(opts.status)
        ? { status: { in: opts.status } }
        : { status: opts.status };

  return prisma.lecipmBrokerAutopilotAction.findMany({
    where: { ...base, ...statusFilter },
    orderBy: [{ updatedAt: "desc" }],
    take,
    include: {
      lead: {
        select: {
          id: true,
          guestName: true,
          guestEmail: true,
          status: true,
          threadId: true,
          customer: { select: { name: true, email: true } },
          listing: { select: { id: true, title: true, listingCode: true } },
        },
      },
    },
  });
}

export async function countSuggestedAutopilotActions(brokerUserId: string, isAdmin: boolean): Promise<number> {
  const now = new Date();
  const base = isAdmin ? {} : { brokerUserId };
  return prisma.lecipmBrokerAutopilotAction.count({
    where: {
      ...base,
      status: "suggested",
      OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: now } }],
    },
  });
}
