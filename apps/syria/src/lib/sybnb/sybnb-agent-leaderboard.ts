/**
 * SYBNB-27 — Field agent contributions + weekly-style leaderboard.
 */

import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { syriaPropertyExcludeInvestorDemoWhere } from "@/lib/sybnb/demo-metrics-filter";

function stayListingExcludeDemoWhere(): Prisma.SyriaPropertyWhereInput {
  return {
    category: "stay",
    AND: [syriaPropertyExcludeInvestorDemoWhere()],
  };
}

export type SybnbAgentLeaderboardRow = {
  agentUserId: string;
  displayName: string;
  listingsWindow: number;
  bookingsWindow: number;
  score: number;
};

function formatAgentDisplay(user: { name: string | null; email: string }): string {
  const n = user.name?.trim();
  if (n) return n.length > 48 ? `${n.slice(0, 45)}…` : n;
  const local = user.email.split("@")[0] ?? user.email;
  return local.length > 32 ? `${local.slice(0, 29)}…` : local;
}

/**
 * Rolling window (default 7 days, UTC) — listings created + SybnbBooking rows created on attributed stays.
 */
export async function getSybnbAgentLeaderboard(opts?: {
  windowDays?: number;
  limit?: number;
}): Promise<SybnbAgentLeaderboardRow[]> {
  const windowDays = opts?.windowDays ?? 7;
  const limit = opts?.limit ?? 25;

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - windowDays);
  since.setUTCHours(0, 0, 0, 0);

  const listingWhere: Prisma.SyriaPropertyWhereInput = {
    ...stayListingExcludeDemoWhere(),
    sybnbAgentUserId: { not: null },
    createdAt: { gte: since },
  };

  const listingGroups = await prisma.syriaProperty.groupBy({
    by: ["sybnbAgentUserId"],
    where: listingWhere,
    _count: { _all: true },
  });

  const bookings = await prisma.sybnbBooking.findMany({
    where: {
      createdAt: { gte: since },
      listing: {
        category: "stay",
        sybnbAgentUserId: { not: null },
        AND: [syriaPropertyExcludeInvestorDemoWhere()],
      },
    },
    select: {
      listing: { select: { sybnbAgentUserId: true } },
    },
  });

  const bookingsByAgent = new Map<string, number>();
  for (const b of bookings) {
    const aid = b.listing.sybnbAgentUserId;
    if (!aid) continue;
    bookingsByAgent.set(aid, (bookingsByAgent.get(aid) ?? 0) + 1);
  }

  const agentIds = new Set<string>();
  for (const g of listingGroups) {
    if (g.sybnbAgentUserId) agentIds.add(g.sybnbAgentUserId);
  }
  for (const id of bookingsByAgent.keys()) agentIds.add(id);

  const listingsMap = new Map(
    listingGroups.filter((g) => g.sybnbAgentUserId).map((g) => [g.sybnbAgentUserId!, g._count._all]),
  );

  const scored: SybnbAgentLeaderboardRow[] = [];
  for (const agentUserId of agentIds) {
    const listingsWindow = listingsMap.get(agentUserId) ?? 0;
    const bookingsWindow = bookingsByAgent.get(agentUserId) ?? 0;
    const score = listingsWindow + bookingsWindow * 5;
    scored.push({
      agentUserId,
      displayName: agentUserId,
      listingsWindow,
      bookingsWindow,
      score,
    });
  }

  scored.sort((a, b) => b.score - a.score || b.bookingsWindow - a.bookingsWindow);

  const top = scored.slice(0, limit);
  if (top.length === 0) return [];

  const users = await prisma.syriaAppUser.findMany({
    where: { id: { in: top.map((r) => r.agentUserId) } },
    select: { id: true, name: true, email: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  return top.map((row) => {
    const u = userMap.get(row.agentUserId);
    return {
      ...row,
      displayName: u ? formatAgentDisplay(u) : row.agentUserId.slice(0, 8),
    };
  });
}
