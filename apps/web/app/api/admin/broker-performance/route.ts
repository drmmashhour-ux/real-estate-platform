import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { brokerMarketplaceRankingFlags } from "@/config/feature-flags";
import { buildBrokerMarketplaceRankings } from "@/modules/broker/performance/broker-marketplace-ranking.service";
import { summarizeRoutingReadinessFromRankings } from "@/modules/broker/performance/broker-routing-readiness.service";

export const dynamic = "force-dynamic";

/** Admin-only: marketplace rankings + routing readiness (single pass over brokers). */
export async function GET() {
  if (!brokerMarketplaceRankingFlags.brokerMarketplaceRankingV1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rankings = await buildBrokerMarketplaceRankings();
  const readiness = summarizeRoutingReadinessFromRankings(rankings);

  return NextResponse.json({ rankings, readiness });
}
