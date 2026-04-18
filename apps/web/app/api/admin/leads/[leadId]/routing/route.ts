import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { brokerRoutingFlags } from "@/config/feature-flags";
import { buildLeadRoutingSummary } from "@/modules/broker/routing/broker-routing.service";

export const dynamic = "force-dynamic";

/** GET — advisory broker candidates for a lead (admin only; no assignment). */
export async function GET(_req: Request, { params }: { params: Promise<{ leadId: string }> }) {
  if (!brokerRoutingFlags.brokerRoutingV1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { leadId } = await params;
  const summary = await buildLeadRoutingSummary(leadId);
  if (!summary) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  return NextResponse.json({ summary });
}
