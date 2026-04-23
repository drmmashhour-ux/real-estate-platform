import { NextResponse } from "next/server";
import type { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { appendLeadTimelineEvent } from "@/lib/leads/timeline-helpers";
import { assertBrokerCanReceiveNewLead } from "@/modules/billing/brokerLeadBilling";
import { brokerLeadDistributionFlags, brokerRoutingFlags } from "@/config/feature-flags";
import { buildBrokerLeadRoutingDecision } from "@/modules/broker/distribution/broker-lead-routing.service";
import { recordBrokerLeadDistributionOverride } from "@/modules/broker/distribution/broker-lead-distribution-monitoring.service";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = new Set<PlatformRole>(["ADMIN", "ACCOUNTANT"]);

/**
 * POST — manual assignment / override with audit trail on timeline (does not alter lead message body).
 */
export async function POST(req: Request, ctx: { params: Promise<{ leadId: string }> }) {
  if (!brokerLeadDistributionFlags.brokerLeadDistributionV1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || !ADMIN_ROLES.has(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { brokerId?: string; overrideNote?: string; recommendedBrokerId?: string | null };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const brokerId = typeof body.brokerId === "string" ? body.brokerId.trim() : "";
  if (!brokerId) return NextResponse.json({ error: "brokerId required" }, { status: 400 });

  const { leadId } = await ctx.params;

  const leadExists = await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true } });
  if (!leadExists) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const broker = await prisma.user.findUnique({ where: { id: brokerId }, select: { role: true } });
  if (!broker || broker.role !== "BROKER") {
    return NextResponse.json({ error: "Target user is not a broker" }, { status: 400 });
  }

  const gate = await assertBrokerCanReceiveNewLead(prisma, brokerId);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.reason ?? "Broker cannot receive lead" }, { status: 400 });
  }

  let recommendedBrokerId: string | null | undefined = body.recommendedBrokerId;
  if (recommendedBrokerId === undefined) {
    const decision = await buildBrokerLeadRoutingDecision(leadId, { poolSize: 48, topCandidates: 3 });
    recommendedBrokerId = decision?.recommendedBrokerId ?? null;
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: { introducedByBrokerId: brokerId },
  });

  await appendLeadTimelineEvent(leadId, "lead_distribution_assign", {
    brokerId,
    recommendedBrokerId: recommendedBrokerId ?? null,
    actualBrokerId: brokerId,
    overrideNote:
      typeof body.overrideNote === "string" && body.overrideNote.trim().length > 0
        ? body.overrideNote.trim().slice(0, 2000)
        : undefined,
    actorUserId: userId,
    mode:
      recommendedBrokerId != null && recommendedBrokerId !== brokerId ? "manual_override" : "manual_assign",
  });

  try {
    recordBrokerLeadDistributionOverride();
  } catch {
    /* noop */
  }

  return NextResponse.json({ ok: true });
}
