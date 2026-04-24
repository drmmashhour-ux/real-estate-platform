import { NextResponse } from "next/server";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { prisma } from "@/lib/db";
import { generatePrivateInvestorPacketRecord } from "@/modules/private-investor-packet/private-investor-packet.service";

export const dynamic = "force-dynamic";

/**
 * POST — broker generates a new versioned packet (does not send). Eligibility enforced.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { role: true },
  });
  if (auth.deal.brokerId !== auth.userId && user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Assignee broker only" }, { status: 403 });
  }

  let body: { investorId?: string; spvId?: string | null };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const investorId = typeof body.investorId === "string" ? body.investorId.trim() : "";
  if (!investorId) {
    return NextResponse.json({ error: "investorId required" }, { status: 400 });
  }

  try {
    const packet = await generatePrivateInvestorPacketRecord({
      dealId,
      investorId,
      spvId: typeof body.spvId === "string" && body.spvId.trim() ? body.spvId.trim() : null,
      actorBrokerUserId: auth.userId,
    });
    return NextResponse.json({
      ok: true,
      packet: {
        id: packet.id,
        version: packet.version,
        status: packet.status,
        investorId: packet.investorId,
      },
    });
  } catch (e) {
    const err = e as Error & { blockers?: string[] };
    if (err.message === "PACKET_ELIGIBILITY_BLOCKED" && err.blockers) {
      return NextResponse.json(
        { error: err.message, blockers: err.blockers, privatePacket: true },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { error: err.message ?? "GENERATION_FAILED" },
      { status: 400 },
    );
  }
}
