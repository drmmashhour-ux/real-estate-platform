import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { requireBrokerDealAccess } from "@/lib/broker/residential-access";
import { prisma } from "@/lib/db";
import {
  assertPrivateInvestorPacketEligibility,
  getLatestPrivateInvestorPacket,
} from "@/modules/private-investor-packet";

export const dynamic = "force-dynamic";

/**
 * GET — latest packet + eligibility preview.
 * Brokers (assignee or admin): full payload. Released recipient (logged-in user === investorId): summary + HTML only for their packet.
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string; investorId: string }> }) {
  const { id: dealId, investorId } = await context.params;

  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let isBrokerViewer = false;
  if (user.role === "BROKER" || user.role === "ADMIN") {
    const deal = await requireBrokerDealAccess(userId, dealId, user.role === "ADMIN");
    if (deal && (deal.brokerId === userId || user.role === "ADMIN")) {
      isBrokerViewer = true;
    }
  }

  const packet = await getLatestPrivateInvestorPacket(dealId, investorId);
  const isReleasedRecipient = userId === investorId && packet?.status === "RELEASED";

  if (!isBrokerViewer && !isReleasedRecipient) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const eligibility = await assertPrivateInvestorPacketEligibility({
    dealId,
    investorUserId: investorId,
    spvId: packet?.spvId ?? null,
  });

  if (!isBrokerViewer && packet && packet.status !== "RELEASED") {
    return NextResponse.json(
      { error: "Packet not released to investor", privatePacket: true },
      { status: 403 },
    );
  }

  const showContent = isBrokerViewer || packet?.status === "RELEASED";

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
        summary: showContent ? packet.packetSummaryJson : null,
        htmlBundle: showContent ? packet.htmlBundle : null,
      }
    : null,
  });
}
