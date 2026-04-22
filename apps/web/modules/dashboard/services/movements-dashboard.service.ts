import { prisma } from "@/lib/db";

import type { MovementsDashboardData } from "../view-models";

function timeLabel(d: Date): string {
  const hh = `${d.getHours()}`.padStart(2, "0");
  const mm = `${d.getMinutes()}`.padStart(2, "0");
  return `${hh}:${mm}`;
}

export async function getMovementsDashboardData(options?: {
  limit?: number;
}): Promise<MovementsDashboardData> {
  const take = Math.min(Math.max(options?.limit ?? 48, 1), 120);
  const perSource = Math.ceil(take / 3);

  const [logs, bookings, leads] = await Promise.all([
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: perSource,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        metadata: true,
        createdAt: true,
      },
    }),
    prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: perSource,
      select: {
        id: true,
        status: true,
        totalCents: true,
        createdAt: true,
      },
    }),
    prisma.listingContactLeadPurchase.findMany({
      orderBy: { createdAt: "desc" },
      take: perSource,
      select: {
        id: true,
        priceCents: true,
        paidAt: true,
        createdAt: true,
        targetListingId: true,
      },
    }),
  ]);

  type Row = MovementsDashboardData["movements"][number];

  const merged: Array<{ at: Date; row: Row }> = [];

  for (const b of bookings) {
    merged.push({
      at: b.createdAt,
      row: {
        id: `bkg-${b.id}`,
        timeLabel: timeLabel(b.createdAt),
        typeLabel: "Booking",
        hubLabel: "BNHub",
        detail: `Stay booking · ${(b.totalCents / 100).toFixed(0)} CAD · ${b.status}`,
        hubSlug: "bnhub",
        deepLink: null,
      },
    });
  }

  for (const l of leads) {
    const at = l.paidAt ?? l.createdAt;
    merged.push({
      at,
      row: {
        id: `lead-${l.id}`,
        timeLabel: timeLabel(at),
        typeLabel: "Lead unlock",
        hubLabel: "Broker Hub",
        detail: `Contact unlock · listing ${l.targetListingId.slice(0, 8)}…`,
        hubSlug: "broker",
        deepLink: null,
      },
    });
  }

  for (const a of logs) {
    merged.push({
      at: a.createdAt,
      row: {
        id: `log-${a.id}`,
        timeLabel: timeLabel(a.createdAt),
        typeLabel: a.action.replace(/_/g, " "),
        hubLabel: hubFromEntity(a.entityType),
        detail: [a.entityType, a.entityId].filter(Boolean).join(" ") || "Platform activity",
        hubSlug: null,
        deepLink: null,
      },
    });
  }

  merged.sort((a, b) => b.at.getTime() - a.at.getTime());

  const movements = merged.slice(0, take).map((m) => m.row);

  return { movements };
}

function hubFromEntity(entityType: string | null): string {
  switch (entityType) {
    case "listing":
      return "Seller Hub";
    case "booking":
      return "BNHub";
    case "transaction":
      return "Platform";
    default:
      return "LECIPM";
  }
}
