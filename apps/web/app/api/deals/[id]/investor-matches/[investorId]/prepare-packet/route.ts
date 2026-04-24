import { NextResponse } from "next/server";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import {
  recordDealInvestorMatchLearning,
  recordInvestorMatchAudit,
} from "@/modules/deal-investor-match";
import { assertPrivateInvestorPacketEligibility } from "@/modules/private-investor-packet";
import { generatePrivateInvestorPacketRecord } from "@/modules/private-investor-packet/private-investor-packet.service";

export const dynamic = "force-dynamic";

/**
 * POST — broker-selected packet preparation; blocked until compliance passes. Never auto-sends.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string; investorId: string }> }) {
  const { id: dealId, investorId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;
  if (auth.deal.brokerId !== auth.userId && auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Assignee broker only" }, { status: 403 });
  }

  let body: { spvId?: string | null };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }
  const spvId = typeof body.spvId === "string" && body.spvId.trim() ? body.spvId.trim() : null;

  await recordInvestorMatchAudit({
    dealId,
    investorId,
    actorUserId: auth.userId,
    action: "investor_selected_by_broker",
    metadata: { spvId },
  });

  const elig = await assertPrivateInvestorPacketEligibility({ dealId, investorUserId: investorId, spvId });
  if (!elig.ok) {
    await recordInvestorMatchAudit({
      dealId,
      investorId,
      actorUserId: auth.userId,
      action: "investor_blocked_compliance",
      metadata: { blockers: elig.blockers },
    });
    return NextResponse.json(
      {
        ok: false,
        error: "COMPLIANCE_BLOCKED",
        investorMatchAi: true,
        blockers: elig.blockers,
      },
      { status: 403 },
    );
  }

  try {
    const packet = await generatePrivateInvestorPacketRecord({
      dealId,
      investorId,
      spvId,
      actorBrokerUserId: auth.userId,
    });
    await recordInvestorMatchAudit({
      dealId,
      investorId,
      actorUserId: auth.userId,
      action: "packet_prepared",
      metadata: { packetId: packet.id, version: packet.version },
    });
    await recordDealInvestorMatchLearning({
      dealId,
      investorId,
      eventType: "PACKET_PREPARED",
      metadata: { packetId: packet.id, version: packet.version },
    });
    return NextResponse.json({
      ok: true,
      investorMatchAi: true,
      packet: { id: packet.id, version: packet.version, status: packet.status, investorId: packet.investorId },
    });
  } catch (e) {
    const err = e as Error & { blockers?: string[] };
    if (err.message === "PACKET_ELIGIBILITY_BLOCKED" && err.blockers) {
      await recordInvestorMatchAudit({
        dealId,
        investorId,
        actorUserId: auth.userId,
        action: "investor_blocked_compliance",
        metadata: { blockers: err.blockers },
      });
      return NextResponse.json(
        { ok: false, error: err.message, blockers: err.blockers, investorMatchAi: true },
        { status: 403 },
      );
    }
    return NextResponse.json({ ok: false, error: err.message ?? "PREPARE_FAILED" }, { status: 400 });
  }
}
