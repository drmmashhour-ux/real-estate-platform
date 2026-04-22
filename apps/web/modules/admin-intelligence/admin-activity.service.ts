import { prisma } from "@/lib/db";

import type { AdminRecentActivityItem } from "./admin-intelligence.types";

export async function getRecentAdminActivity(limit = 12): Promise<AdminRecentActivityItem[]> {
  const take = Math.min(40, Math.max(4, limit));

  const [bookings, leads, payments] = await Promise.all([
    prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        createdAt: true,
        status: true,
        listing: { select: { title: true } },
      },
    }),
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, createdAt: true, pipelineStatus: true, name: true },
    }),
    prisma.platformPayment.findMany({
      where: { status: "paid" },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        createdAt: true,
        paymentType: true,
        amountCents: true,
        platformFeeCents: true,
      },
    }),
  ]);

  const items: AdminRecentActivityItem[] = [];

  for (const b of bookings) {
    items.push({
      id: `b-${b.id}`,
      kind: "booking",
      label: "Booking",
      detail: `${b.listing?.title ?? "Stay"} · ${b.status}`,
      occurredAt: b.createdAt.toISOString(),
    });
  }
  for (const l of leads) {
    items.push({
      id: `l-${l.id}`,
      kind: "lead",
      label: "Lead",
      detail: `${l.name ?? "Lead"} · ${l.pipelineStatus ?? "new"}`,
      occurredAt: l.createdAt.toISOString(),
    });
  }
  for (const p of payments) {
    items.push({
      id: `p-${p.id}`,
      kind: "payment",
      label: "Payment",
      detail: p.paymentType,
      occurredAt: p.createdAt.toISOString(),
      amountCents: p.platformFeeCents ?? p.amountCents,
    });
  }

  items.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  return items.slice(0, take);
}
