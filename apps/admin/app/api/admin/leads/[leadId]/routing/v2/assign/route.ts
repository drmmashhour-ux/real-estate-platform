import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { brokerRoutingFlags, smartRoutingV2Flags } from "@/config/feature-flags";
import {
  applyRoutingDecisionManually,
  buildRoutingDecision,
  executeRoutingDecision,
} from "@/modules/broker/routing/broker-routing-decision.service";

export const dynamic = "force-dynamic";

type Body = {
  action?: "approve" | "reject" | "auto";
  brokerId?: string;
};

/**
 * POST — approve (manual assign recommended or chosen broker), reject (no-op), or run gated auto-assign.
 */
export async function POST(req: Request, { params }: { params: Promise<{ leadId: string }> }) {
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
  const body = (await req.json().catch(() => ({}))) as Body;
  const action = body.action;

  if (action === "reject") {
    return NextResponse.json({ ok: true, detail: "Suggestion dismissed — no CRM change." });
  }

  if (action === "auto") {
    if (!smartRoutingV2Flags.smartRoutingAutoAssign) {
      return NextResponse.json({ error: "Auto-assign feature is disabled" }, { status: 400 });
    }
    const decision = await buildRoutingDecision(leadId);
    if (!decision) {
      return NextResponse.json({ error: "No routing decision" }, { status: 404 });
    }
    const result = await executeRoutingDecision(decision);
    return NextResponse.json(result);
  }

  if (action === "approve") {
    const decision = await buildRoutingDecision(leadId);
    if (!decision) {
      return NextResponse.json({ error: "No routing decision" }, { status: 404 });
    }
    const brokerId = typeof body.brokerId === "string" && body.brokerId.trim() ? body.brokerId.trim() : decision.recommendedBrokerId;
    const isOverride = brokerId !== decision.recommendedBrokerId;
    const applied = await applyRoutingDecisionManually(leadId, brokerId, {
      source: isOverride ? "routing_v2_panel_override" : "routing_v2_panel_approve",
    });
    if (!applied.ok) {
      return NextResponse.json({ error: applied.detail }, { status: 400 });
    }
    return NextResponse.json({ ok: true, detail: "Introducing broker updated.", brokerId });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
