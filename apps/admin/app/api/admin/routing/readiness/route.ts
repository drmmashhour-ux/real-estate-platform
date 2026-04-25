import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { brokerRoutingFlags } from "@/config/feature-flags";
import { buildLeadRoutingReadiness } from "@/modules/broker/routing/broker-routing-readiness.service";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!brokerRoutingFlags.brokerRoutingV1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const readiness = await buildLeadRoutingReadiness();
  return NextResponse.json({ readiness });
}
