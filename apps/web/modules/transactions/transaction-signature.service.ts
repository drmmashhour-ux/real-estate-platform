import { createHash } from "node:crypto";
import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { recordBrokerUsageEvent, usageAmountForType } from "@/modules/billing/lecipm-launch-usage";
import { appendAuditProof } from "./transaction-audit-proof.service";
import { assertDocumentEditable } from "./transaction-document.service";
import { logTimelineEvent } from "./transaction-timeline.service";

const TAG = "[transaction.signature]";

function sha256Hex(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

export async function createSignaturePacket(transactionId: string, documentId: string) {
  await assertDocumentEditable(documentId);

  const doc = await prisma.lecipmSdDocument.findUnique({ where: { id: documentId } });
  if (!doc || doc.transactionId !== transactionId) throw new Error("Document not in transaction");

  const packet = await prisma.lecipmSdSignaturePacket.create({
    data: {
      transactionId,
      documentId,
      status: "DRAFT",
      provider: "INTERNAL",
    },
  });

  await appendAuditProof({
    transactionId,
    documentId,
    eventType: "SIGNATURE_PACKET_CREATED",
    payload: { packetId: packet.id, documentId },
  });
  await logTimelineEvent(prisma, transactionId, "SIGNATURE_PACKET_CREATED", `Packet ${packet.id} for document ${documentId}`);
  logInfo(TAG, { action: "createPacket", packetId: packet.id });
  return packet;
}

export async function addSigner(
  packetId: string,
  signer: { role: string; name: string; email: string }
) {
  const packet = await prisma.lecipmSdSignaturePacket.findUnique({
    where: { id: packetId },
    select: { id: true, transactionId: true, status: true },
  });
  if (!packet) throw new Error("Packet not found");
  if (packet.status !== "DRAFT") throw new Error("Cannot add signers after send");

  const row = await prisma.lecipmSdSignatureSigner.create({
    data: {
      packetId,
      transactionId: packet.transactionId,
      role: signer.role.slice(0, 24),
      name: signer.name.slice(0, 512),
      email: signer.email.trim().slice(0, 320),
      status: "PENDING",
    },
  });
  logInfo(TAG, { action: "addSigner", signerId: row.id });
  return row;
}

export async function sendPacket(packetId: string) {
  const packet = await prisma.lecipmSdSignaturePacket.findUnique({
    where: { id: packetId },
    include: { signers: true },
  });
  if (!packet) throw new Error("Packet not found");
  if (packet.signers.length === 0) throw new Error("No signers");
  if (packet.status !== "DRAFT") throw new Error("Packet already sent");

  const sentAt = new Date();
  await prisma.$transaction([
    prisma.lecipmSdSignaturePacket.update({
      where: { id: packetId },
      data: { status: "SENT", sentAt },
    }),
    prisma.lecipmSdSignatureSigner.updateMany({
      where: { packetId },
      data: { status: "SENT" },
    }),
  ]);

  await appendAuditProof({
    transactionId: packet.transactionId,
    documentId: packet.documentId,
    eventType: "SIGNATURE_SENT",
    payload: { packetId, signerIds: packet.signers.map((s) => s.id) },
  });
  await logTimelineEvent(prisma, packet.transactionId, "SIGNATURE_SENT", `Signature packet ${packetId} sent`);
  logInfo(TAG, { action: "send", packetId });

  const txBroker = await prisma.lecipmSdTransaction.findUnique({
    where: { id: packet.transactionId },
    select: { brokerId: true },
  });
  if (txBroker) {
    await recordBrokerUsageEvent({
      userId: txBroker.brokerId,
      type: "SIGNATURE",
      amount: usageAmountForType("SIGNATURE"),
      metaJson: { transactionId: packet.transactionId, packetId },
    });
  }

  return prisma.lecipmSdSignaturePacket.findUnique({
    where: { id: packetId },
    include: { signers: true },
  });
}

export async function markViewed(signerId: string, ipAddress: string | null, userAgent: string | null) {
  const signer = await prisma.lecipmSdSignatureSigner.findUnique({
    where: { id: signerId },
    include: { packet: true },
  });
  if (!signer) throw new Error("Signer not found");
  if (signer.status !== "SENT") {
    throw new Error("Signer must be SENT to mark viewed");
  }

  const updated = await prisma.lecipmSdSignatureSigner.update({
    where: { id: signerId },
    data: {
      status: "VIEWED",
      ipAddress: ipAddress?.slice(0, 64) ?? signer.ipAddress,
      userAgent: userAgent ?? signer.userAgent,
    },
  });

  await appendAuditProof({
    transactionId: signer.transactionId,
    documentId: signer.packet.documentId,
    eventType: "SIGNATURE_VIEWED",
    payload: { signerId, packetId: signer.packetId },
  });
  await logTimelineEvent(prisma, signer.transactionId, "SIGNATURE_VIEWED", `Signer ${signer.email} viewed`);
  logInfo(TAG, { action: "viewed", signerId });
  return updated;
}

export async function signDocument(
  signerId: string,
  ctx: { ipAddress: string | null; userAgent: string | null }
) {
  const signer = await prisma.lecipmSdSignatureSigner.findUnique({
    where: { id: signerId },
    include: { packet: true },
  });
  if (!signer) throw new Error("Signer not found");
  if (!signer.name?.trim() || !signer.email?.trim()) {
    throw new Error("Signer identity (name, email) required before signature");
  }
  if (signer.status !== "SENT" && signer.status !== "VIEWED") {
    throw new Error(`Signer cannot sign in status ${signer.status}`);
  }

  const doc = await prisma.lecipmSdDocument.findUnique({
    where: { id: signer.packet.documentId },
  });
  if (!doc) throw new Error("Document missing");
  if (doc.lockedAt) throw new Error("Document already immutable");

  const signedAt = new Date();
  const ip = ctx.ipAddress?.slice(0, 64) ?? "";
  const ua = ctx.userAgent ?? "";
  if (!ip.trim()) throw new Error("Client IP address is required for signature capture");
  if (!ua.trim()) throw new Error("User-Agent is required for signature capture");
  const docFingerprint = `${doc.bodyHtml ?? ""}|${doc.fileUrl ?? ""}|${doc.versionNumber}|${doc.transactionNumber}`;
  const signatureMaterial = `${docFingerprint}|${signer.id}|${signer.email}|${signedAt.toISOString()}|${doc.transactionNumber}`;
  const signatureHash = sha256Hex(signatureMaterial);

  const updatedSigner = await prisma.lecipmSdSignatureSigner.update({
    where: { id: signerId },
    data: {
      status: "SIGNED",
      signedAt,
      ipAddress: ip || undefined,
      userAgent: ua || undefined,
      signatureHash,
      identityVerified: true,
    },
  });

  await appendAuditProof({
    transactionId: signer.transactionId,
    documentId: doc.id,
    eventType: "SIGNATURE_COMPLETED",
    payload: {
      signerId,
      packetId: signer.packetId,
      signatureHash,
      signedAt: signedAt.toISOString(),
    },
  });
  await logTimelineEvent(
    prisma,
    signer.transactionId,
    "SIGNATURE_COMPLETED",
    `${signer.email} signed (${signer.role})`
  );

  await syncPacketProgress(signer.packetId);
  logInfo(TAG, { action: "sign", signerId });
  return updatedSigner;
}

async function syncPacketProgress(packetId: string) {
  const packet = await prisma.lecipmSdSignaturePacket.findUnique({
    where: { id: packetId },
    include: { signers: true },
  });
  if (!packet) return;

  const total = packet.signers.length;
  const signedCount = packet.signers.filter((s) => s.status === "SIGNED").length;

  if (signedCount === total && total > 0) {
    await prisma.lecipmSdSignaturePacket.update({
      where: { id: packetId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    await lockSignedDocument(packet.documentId);
    return;
  }

  if (signedCount > 0 && signedCount < total) {
    await prisma.lecipmSdSignaturePacket.update({
      where: { id: packetId },
      data: { status: "PARTIALLY_SIGNED" },
    });
  }
}

async function lockSignedDocument(documentId: string) {
  const doc = await prisma.lecipmSdDocument.findUnique({ where: { id: documentId } });
  if (!doc) throw new Error("Document not found");

  const canonical = JSON.stringify({
    bodyHtml: doc.bodyHtml ?? "",
    fileUrl: doc.fileUrl ?? "",
    versionNumber: doc.versionNumber,
    transactionNumber: doc.transactionNumber,
  });
  const immutableContentHash = sha256Hex(canonical);
  const lockedAt = new Date();

  await prisma.lecipmSdDocument.update({
    where: { id: documentId },
    data: {
      status: "FINAL",
      lockedAt,
      immutableContentHash,
    },
  });

  await appendAuditProof({
    transactionId: doc.transactionId,
    documentId,
    eventType: "DOCUMENT_LOCKED",
    payload: { immutableContentHash, lockedAt: lockedAt.toISOString() },
  });
  await logTimelineEvent(prisma, doc.transactionId, "DOCUMENT_LOCKED", `Document ${documentId} locked after signatures`);
}

export async function completePacket(packetId: string) {
  const packet = await prisma.lecipmSdSignaturePacket.findUnique({
    where: { id: packetId },
    include: { signers: true },
  });
  if (!packet) throw new Error("Packet not found");
  const allSigned = packet.signers.length > 0 && packet.signers.every((s) => s.status === "SIGNED");
  if (!allSigned) throw new Error("Not all signers have signed");

  await prisma.lecipmSdSignaturePacket.update({
    where: { id: packetId },
    data: { status: "COMPLETED", completedAt: new Date() },
  });
  await lockSignedDocument(packet.documentId);
}

export async function listSignaturePackets(transactionId: string) {
  return prisma.lecipmSdSignaturePacket.findMany({
    where: { transactionId },
    include: {
      signers: true,
      document: { select: { id: true, title: true, status: true, transactionNumber: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
