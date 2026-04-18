import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { brokerRoutingFlags, smartRoutingV2Flags } from "@/config/feature-flags";
import { buildRoutingDecision } from "@/modules/broker/routing/broker-routing-decision.service";
import { ROUTING_V2_AUTO_ASSIGN_MIN_CONFIDENCE } from "@/modules/broker/routing/broker-routing-policy";

export const dynamic = "force-dynamic";

/** GET — routing V2 decision (admin; builds on V1). */
export async function GET(_req: Request, { params }: { params: Promise<{ leadId: string }> }) {
  if (!smartRoutingV2Flags.smartRoutingV2 || !brokerRoutingFlags.brokerRoutingV1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { leadId } = await params;
  const decision = await buildRoutingDecision(leadId);
  if (!decision) {
    return NextResponse.json({ error: "Lead not found or no routable candidate" }, { status: 404 });
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { introducedByBrokerId: true },
  });

  return NextResponse.json({
    decision,
    existingIntroducerId: lead?.introducedByBrokerId ?? null,
    autoEligibleHint:
      !decision.requiresApproval &&
      decision.confidenceScore >= ROUTING_V2_AUTO_ASSIGN_MIN_CONFIDENCE &&
      smartRoutingV2Flags.smartRoutingAutoAssign,
  });
}
