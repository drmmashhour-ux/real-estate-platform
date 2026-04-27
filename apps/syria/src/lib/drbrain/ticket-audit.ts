import type { DrBrainTicket, DrBrainTicketStatus } from "@repo/drbrain";
import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";

const OPEN = "DRBRAIN_TICKET_OPEN";
const STATUS = "DRBRAIN_TICKET_STATUS";

export async function persistSyriaDrBrainTicketsEmitted(tickets: DrBrainTicket[]): Promise<void> {
  for (const t of tickets) {
    await prisma.syriaSybnbCoreAudit.create({
      data: {
        bookingId: null,
        event: OPEN,
        metadata: {
          snapshot: {
            id: t.id,
            appId: t.appId,
            appEnv: t.appEnv,
            severity: t.severity,
            category: t.category,
            title: t.title,
            description: t.description,
            recommendedActions: t.recommendedActions,
            status: t.status,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
            metadata: t.metadata ?? {},
          },
        } as Prisma.InputJsonValue,
      },
    });
  }
}

export async function appendSyriaDrBrainTicketStatus(input: {
  ticketId: string;
  status: DrBrainTicketStatus;
  actorId: string;
}): Promise<void> {
  await prisma.syriaSybnbCoreAudit.create({
    data: {
      bookingId: null,
      event: STATUS,
      metadata: {
        ticketId: input.ticketId,
        status: input.status,
        actorId: input.actorId,
      } as Prisma.InputJsonValue,
    },
  });
}

export async function loadSyriaDrBrainTicketsFromAudit(): Promise<DrBrainTicket[]> {
  const rows = await prisma.syriaSybnbCoreAudit.findMany({
    where: {
      OR: [{ event: OPEN }, { event: STATUS }],
    },
    orderBy: { createdAt: "asc" },
    take: 400,
    select: { event: true, metadata: true, createdAt: true },
  });

  const byId = new Map<string, DrBrainTicket>();

  for (const row of rows) {
    const meta = row.metadata as Record<string, unknown> | null;
    if (!meta) continue;

    if (row.event === OPEN) {
      const snap = meta.snapshot as DrBrainTicket | undefined;
      if (snap?.id) {
        byId.set(snap.id, { ...snap });
      }
      continue;
    }

    if (row.event === STATUS) {
      const ticketId = String(meta.ticketId ?? "");
      const status = meta.status as DrBrainTicketStatus | undefined;
      const cur = byId.get(ticketId);
      if (cur && status) {
        byId.set(ticketId, {
          ...cur,
          status,
          updatedAt: row.createdAt.toISOString(),
        });
      }
    }
  }

  return [...byId.values()].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export async function syriaDrBrainTicketExists(ticketId: string): Promise<boolean> {
  const tickets = await loadSyriaDrBrainTicketsFromAudit();
  return tickets.some((t) => t.id === ticketId);
}
