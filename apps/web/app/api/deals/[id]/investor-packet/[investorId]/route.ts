import { NextResponse } from "next/server";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { authenticateDealParticipantRoute } from "@/lib/deals/execution-access";
import { prisma } from "@/lib/db";
import {
  assertPrivateInvestorPacketEligibility,
  getLatestPrivateInvestorPacket,
} from "@/modules/private-investor-packet";

export const dynamic = "force-dynamic";

/**
 * GET — latest packet + eligibility preview (broker sees all; investor sees only if released and self).
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string; investorId: string }> }) {
  const { id: dealId, investorId } = await context.params;

  const brokerAuth = await authenticateBrokerDealRoute(dealId);
  const participant = await authenticateDealParticipantRoute(dealId);

  if (!brokerAuth.ok && !participant.ok) {
    return participant.ok === false ? participant.response : brokerAuth.response;
  }

  const isBroker = brokerAuth.ok && (brokerAuth.deal.brokerId === brokerAuth.userId || brokerAuth.role === "ADMIN");
  const isSelfInvestor =
    participant.ok && participant.userId === investorId && participant.deal.buyerId === investorId;

  if (!isBroker && !isSelfInvestor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const eligibility = await assertPrivateInvestorPacketEligibility({
    dealId,
    investorUserId: investorId,
    spvId: null,
  });

  const packet = await getLatestPrivateInvestorPacket(dealId, investorId);

  if (!isBroker && packet && packet.status !== "RELEASED") {
    return NextResponse.json(
      { error: "Packet not released to investor", privatePacket: true },
      { status: 403 },
    );
  }

  return NextResponse.json({
    ok: true,
    eligibility,
    packet: packet ?
      {
        id: packet.id,
        version: packet.version,
        status: packet.status,
        generatedAt: packet.generatedAt.toISOString(),
        approvedAt: packet.approvedAt?.toISOString() ?? null,
        releasedAt: packet.releasedAt?.toISOString() ?? null,
        documents: packet.documents.map((d) => ({
          id: d.id,
          documentType: d.documentType,
          documentId: d.documentId,
          version: d.version,
          dealDocumentType: d.document.type,
        })),
        summary: isBroker || packet.status === "RELEASED" ? packet.packetSummaryJson : null,
        htmlBundle: isBroker || packet.status === "RELEASED" ? packet.htmlBundle : null,
      }
    : null,
  });
}
