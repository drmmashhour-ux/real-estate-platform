import { NextResponse } from "next/server";
import type { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { brokerLeadDistributionFlags, brokerRoutingFlags } from "@/config/feature-flags";
import { buildBrokerLeadRoutingDecision } from "@/modules/broker/distribution/broker-lead-routing.service";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = new Set<PlatformRole>(["ADMIN", "ACCOUNTANT"]);

/** GET — explainable routing recommendation (no assignment). */
export async function GET(_req: Request, ctx: { params: Promise<{ leadId: string }> }) {
  if (
    !brokerLeadDistributionFlags.brokerLeadDistributionV1 ||
    !brokerLeadDistributionFlags.brokerLeadDistributionPanelV1 ||
    !brokerRoutingFlags.brokerRoutingV1
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || !ADMIN_ROLES.has(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { leadId } = await ctx.params;
  const decision = await buildBrokerLeadRoutingDecision(leadId);
  if (!decision) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  return NextResponse.json({
    decision,
    disclaimer:
      "Advisory routing only — confirms assignment explicitly via Assign action; no external messaging from this surface.",
  });
}
