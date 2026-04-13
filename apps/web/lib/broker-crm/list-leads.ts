import type { LecipmBrokerCrmLeadStatus, LecipmBrokerCrmPriorityLabel } from "@prisma/client";
import { prisma } from "@/lib/db";

export type ListLeadsFilter =
  | "all"
  | "new"
  | "high"
  | "followup_due"
  | "closed"
  | "lost";

export async function listBrokerCrmLeads(opts: {
  brokerUserId: string;
  isAdmin: boolean;
  filter: ListLeadsFilter;
  take?: number;
}) {
  const take = opts.take ?? 200;
  const base = opts.isAdmin ? {} : { brokerUserId: opts.brokerUserId };

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const startOfWeek = new Date(now);
  const dow = startOfWeek.getDay();
  const diff = dow === 0 ? 6 : dow - 1;
  startOfWeek.setDate(startOfWeek.getDate() - diff);
  startOfWeek.setHours(0, 0, 0, 0);

  let extra: Record<string, unknown> = {};
  if (opts.filter === "new") extra = { status: "new" as LecipmBrokerCrmLeadStatus };
  if (opts.filter === "high") extra = { priorityLabel: "high" as LecipmBrokerCrmPriorityLabel };
  /** Due today or overdue (anything scheduled through end of today, excluding closed pipeline). */
  if (opts.filter === "followup_due") {
    extra = {
      nextFollowUpAt: { lte: endOfDay },
      status: { notIn: ["closed", "lost"] as LecipmBrokerCrmLeadStatus[] },
    };
  }
  if (opts.filter === "closed") extra = { status: "closed" as LecipmBrokerCrmLeadStatus };
  if (opts.filter === "lost") extra = { status: "lost" as LecipmBrokerCrmLeadStatus };

  const rows = await prisma.lecipmBrokerCrmLead.findMany({
    where: { ...base, ...extra },
    orderBy: [{ priorityScore: "desc" }, { updatedAt: "desc" }],
    take,
    include: {
      listing: { select: { id: true, title: true, listingCode: true } },
      thread: { select: { id: true, lastMessageAt: true } },
      customer: { select: { name: true, email: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    source: r.source,
    priorityLabel: r.priorityLabel,
    priorityScore: r.priorityScore,
    nextFollowUpAt: r.nextFollowUpAt?.toISOString() ?? null,
    lastContactAt: r.lastContactAt?.toISOString() ?? null,
    updatedAt: r.updatedAt.toISOString(),
    guestName: r.guestName,
    guestEmail: r.guestEmail,
    listing: r.listing
      ? { id: r.listing.id, title: r.listing.title, listingCode: r.listing.listingCode }
      : null,
    threadId: r.threadId,
    lastActivityAt: r.thread?.lastMessageAt?.toISOString() ?? r.updatedAt.toISOString(),
    displayName: r.customer?.name?.trim() || r.guestName || r.customer?.email || "Lead",
  }));
}

export async function brokerCrmKpis(brokerUserId: string, isAdmin: boolean) {
  const base = isAdmin ? {} : { brokerUserId };

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const startOfWeek = new Date(now);
  const dow = startOfWeek.getDay();
  const diff = dow === 0 ? 6 : dow - 1;
  startOfWeek.setDate(startOfWeek.getDate() - diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const [newCount, highCount, dueToday, closedWeek] = await Promise.all([
    prisma.lecipmBrokerCrmLead.count({ where: { ...base, status: "new" } }),
    prisma.lecipmBrokerCrmLead.count({ where: { ...base, priorityLabel: "high" } }),
    prisma.lecipmBrokerCrmLead.count({
      where: {
        ...base,
        nextFollowUpAt: { gte: startOfDay, lt: endOfDay },
        status: { notIn: ["closed", "lost"] },
      },
    }),
    prisma.lecipmBrokerCrmLead.count({
      where: {
        ...base,
        status: "closed",
        updatedAt: { gte: startOfWeek },
      },
    }),
  ]);

  return { newLeads: newCount, highPriority: highCount, followUpsDueToday: dueToday, closedThisWeek: closedWeek };
}
