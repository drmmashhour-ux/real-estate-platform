import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { brokerPerformanceFlags } from "@/config/feature-flags";
import { buildBrokerPerformanceSummary } from "@/modules/broker/performance/broker-performance.service";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!brokerPerformanceFlags.brokerPerformanceV1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "BROKER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const summary = await buildBrokerPerformanceSummary(userId);
  if (!summary) return NextResponse.json({ error: "Unable to build summary" }, { status: 500 });

  return NextResponse.json({ summary });
}
