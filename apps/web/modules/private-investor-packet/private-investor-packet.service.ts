import { prisma } from "@/lib/db";
import { assertPrivateInvestorPacketEligibility } from "./private-investor-packet-eligibility.service";
import { buildPrivateInvestorPacketContext } from "./private-investor-packet-context.service";
import {
  compilePrivateInvestorPacketHtml,
  generatePrivateInvestorPacketSections,
} from "./private-investor-packet.generator";
import { recordPrivatePacketAudit, snapshotHashForPacket } from "./private-packet-audit.service";

const DOC_TYPE_ALIASES: { pattern: RegExp; type: string }[] = [
  { pattern: /memo/i, type: "INVESTOR_MEMO" },
  { pattern: /risk/i, type: "RISK_DISCLOSURE" },
  { pattern: /question/i, type: "QUESTIONNAIRE" },
  { pattern: /subscri/i, type: "SUBSCRIPTION_AGREEMENT" },
  { pattern: /exempt/i, type: "EXEMPTION_REPRESENTATION" },
  { pattern: /esg/i, type: "ESG_SUMMARY" },
  { pattern: /underwrit/i, type: "UNDERWRITING_SUMMARY" },
];

function inferDocumentType(dealDocType: string): string {
  for (const { pattern, type } of DOC_TYPE_ALIASES) {
    if (pattern.test(dealDocType)) return type;
  }
  return "DEAL_SUMMARY";
}

export async function generatePrivateInvestorPacketRecord(input: {
  dealId: string;
  investorId: string;
  spvId?: string | null;
  actorBrokerUserId: string;
}) {
  const elig = await assertPrivateInvestorPacketEligibility({
    dealId: input.dealId,
    investorUserId: input.investorId,
    spvId: input.spvId,
  });
  if (!elig.ok) {
    await recordPrivatePacketAudit({
      dealId: input.dealId,
      investorId: input.investorId,
      actorUserId: input.actorBrokerUserId,
      action: "packet_generation_blocked",
      metadata: { blockers: elig.blockers },
    });
    const err = new Error("PACKET_ELIGIBILITY_BLOCKED") as Error & { blockers: string[] };
    err.blockers = elig.blockers;
    throw err;
  }

  const ctx = await buildPrivateInvestorPacketContext(input.dealId, input.investorId, input.spvId);
  const summary = generatePrivateInvestorPacketSections(ctx);
  const html = compilePrivateInvestorPacketHtml(summary);

  const maxRow = await prisma.privateInvestorPacket.aggregate({
    where: { dealId: input.dealId, investorId: input.investorId },
    _max: { version: true },
  });
  const nextVersion = (maxRow._max.version ?? 0) + 1;

  const dealDocs = await prisma.dealDocument.findMany({
    where: { dealId: input.dealId },
    select: { id: true, type: true },
    orderBy: { createdAt: "desc" },
    take: 24,
  });

  const packet = await prisma.$transaction(async (tx) => {
    const p = await tx.privateInvestorPacket.create({
      data: {
        dealId: input.dealId,
        investorId: input.investorId,
        spvId: input.spvId ?? null,
        status: "READY_FOR_REVIEW",
        version: nextVersion,
        packetSummaryJson: summary as object,
        htmlBundle: html,
      },
    });
    for (const d of dealDocs) {
      await tx.privateInvestorPacketDocument.create({
        data: {
          packetId: p.id,
          documentType: inferDocumentType(d.type),
          documentId: d.id,
          version: nextVersion,
        },
      });
    }
    await tx.privateInvestorPacketEngagement.create({
      data: {
        packetId: p.id,
        investorId: input.investorId,
        eventType: "PACKET_GENERATED",
        metadata: { version: nextVersion },
      },
    });
    return p;
  });

  await recordPrivatePacketAudit({
    dealId: input.dealId,
    packetId: packet.id,
    investorId: input.investorId,
    actorUserId: input.actorBrokerUserId,
    action: "packet_generated",
    metadata: { version: nextVersion, documentCount: dealDocs.length },
  });

  return packet;
}

export async function approvePrivateInvestorPacket(input: {
  dealId: string;
  packetId: string;
  brokerUserId: string;
  attestationText: string;
  confirmDisclosuresCorrect: boolean;
}) {
  if (!input.confirmDisclosuresCorrect) {
    throw new Error("DISCLOSURE_CONFIRMATION_REQUIRED");
  }
  if (input.attestationText.trim().length < 20) {
    throw new Error("ATTESTATION_REQUIRED");
  }

  const p = await prisma.privateInvestorPacket.findFirst({
    where: { id: input.packetId, dealId: input.dealId },
    include: { documents: true },
  });
  if (!p) throw new Error("PACKET_NOT_FOUND");
  if (p.status === "RELEASED") throw new Error("PACKET_IMMUTABLE");
  if (p.status !== "DRAFT" && p.status !== "READY_FOR_REVIEW") {
    throw new Error("INVALID_PACKET_STATE");
  }

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
  const updated = await prisma.privateInvestorPacket.update({
    where: { id: p.id },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      approvedByBrokerId: input.brokerUserId,
      brokerAttestationText: input.attestationText.trim(),
      approvalSnapshotJson: {
        summarySha256: hash,
        documentIds: p.documents.map((d) => d.documentId),
        version: p.version,
        attestedAt: new Date().toISOString(),
      } as object,
    },
  });

  await recordPrivatePacketAudit({
    dealId: input.dealId,
    packetId: p.id,
    investorId: p.investorId,
    actorUserId: input.brokerUserId,
    action: "packet_approved",
    metadata: { summarySha256: hash, version: p.version },
  });

  return updated;
}

export async function releasePrivateInvestorPacket(input: {
  dealId: string;
  packetId: string;
  brokerUserId: string;
}) {
  const p = await prisma.privateInvestorPacket.findFirst({
    where: { id: input.packetId, dealId: input.dealId },
  });
  if (!p) throw new Error("PACKET_NOT_FOUND");
  if (p.status !== "APPROVED") throw new Error("PACKET_NOT_APPROVED");

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

  const updated = await prisma.privateInvestorPacket.update({
    where: { id: p.id },
    data: {
      status: "RELEASED",
      releasedAt: new Date(),
      releasedByBrokerId: input.brokerUserId,
    },
  });

  await prisma.privateInvestorPacketEngagement.create({
    data: {
      packetId: p.id,
      investorId: p.investorId,
      eventType: "PACKET_RELEASED",
      metadata: { version: p.version, releasedBy: input.brokerUserId },
    },
  });

  await recordPrivatePacketAudit({
    dealId: input.dealId,
    packetId: p.id,
    investorId: p.investorId,
    actorUserId: input.brokerUserId,
    action: "packet_released",
    metadata: { version: p.version },
  });

  return updated;
}

export async function getLatestPrivateInvestorPacket(dealId: string, investorId: string) {
  return prisma.privateInvestorPacket.findFirst({
    where: { dealId, investorId },
    orderBy: { version: "desc" },
    include: { documents: { include: { document: { select: { id: true, type: true, workflowStatus: true } } } } },
  });
}
