import { prisma } from "@/lib/db";
import { recordPrivatePacketAudit, snapshotHashForPacket } from "./private-packet-audit.service";

/** Broker-only audit hook when a packet version is exported (e.g. HTML/PDF handoff). Does not send email. */
export async function recordPrivateInvestorPacketExport(input: {
  dealId: string;
  investorId: string;
  packetId: string;
  brokerUserId: string;
}) {
  const p = await prisma.privateInvestorPacket.findFirst({
    where: { id: input.packetId, dealId: input.dealId, investorId: input.investorId },
  });
  if (!p) throw new Error("PACKET_NOT_FOUND");

  const deal = await prisma.deal.findUnique({
    where: { id: input.dealId },
    select: { brokerId: true },
  });
  const user = await prisma.user.findUnique({
    where: { id: input.brokerUserId },
    select: { role: true },
  });
  if (deal?.brokerId !== input.brokerUserId && user?.role !== "ADMIN") {
    throw new Error("BROKER_ONLY");
  }

  const hash = snapshotHashForPacket(p.packetSummaryJson);
  await recordPrivatePacketAudit({
    dealId: input.dealId,
    packetId: p.id,
    investorId: p.investorId,
    actorUserId: input.brokerUserId,
    action: "packet_version_exported",
    metadata: { version: p.version, summarySha256: hash },
  });
}
