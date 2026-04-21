import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { appendClosingAudit } from "@/modules/closing/closing-audit";
import { syncDealClosingReadiness } from "@/modules/closing/closing-orchestrator";

const TAG = "[closing-signature]";

export async function seedDefaultSignatures(dealId: string): Promise<number> {
  const existing = await prisma.dealClosingSignature.count({ where: { dealId } });
  if (existing > 0) return 0;

  const rows = await prisma.$transaction([
    prisma.dealClosingSignature.create({
      data: {
        dealId,
        signerName: "Buyer (representative)",
        signerRole: "BUYER",
        required: true,
        status: "PENDING",
      },
    }),
    prisma.dealClosingSignature.create({
      data: {
        dealId,
        signerName: "Seller (representative)",
        signerRole: "SELLER",
        required: true,
        status: "PENDING",
      },
    }),
    prisma.dealClosingSignature.create({
      data: {
        dealId,
        signerName: "Broker / coordinator",
        signerRole: "BROKER",
        required: true,
        status: "PENDING",
      },
    }),
  ]);

  logInfo(`${TAG}`, { dealId, seeded: rows.length });
  return rows.length;
}

export async function addSignatureRow(options: {
  dealId: string;
  actorUserId: string;
  signerName: string;
  signerRole: string;
  documentId?: string | null;
  required?: boolean;
}): Promise<{ id: string }> {
  const row = await prisma.dealClosingSignature.create({
    data: {
      dealId: options.dealId,
      documentId: options.documentId ?? null,
      signerName: options.signerName,
      signerRole: options.signerRole,
      required: options.required ?? true,
      status: "PENDING",
    },
    select: { id: true },
  });

  await appendClosingAudit({
    dealId: options.dealId,
    actorUserId: options.actorUserId,
    eventType: "SIGNATURE_ADDED",
    note: options.signerName,
    metadataJson: { signatureId: row.id },
  });
  await syncDealClosingReadiness(options.dealId);
  logInfo(`${TAG}`, { dealId: options.dealId, id: row.id });
  return row;
}

export async function updateSignatureStatus(options: {
  dealId: string;
  signatureId: string;
  actorUserId: string;
  status: "PENDING" | "SIGNED" | "DECLINED";
  notes?: string | null;
}): Promise<void> {
  const row = await prisma.dealClosingSignature.findFirst({
    where: { id: options.signatureId, dealId: options.dealId },
    select: { id: true, status: true },
  });
  if (!row) throw new Error("Signature row not found");

  await prisma.dealClosingSignature.update({
    where: { id: row.id },
    data: {
      status: options.status,
      signedAt: options.status === "SIGNED" ? new Date() : null,
      notes: options.notes ?? null,
    },
  });

  await appendClosingAudit({
    dealId: options.dealId,
    actorUserId: options.actorUserId,
    eventType: "SIGNATURE_UPDATED",
    note: `${row.status} → ${options.status}`,
    metadataJson: { signatureId: options.signatureId },
  });
  await syncDealClosingReadiness(options.dealId);
  logInfo(`${TAG}`, { dealId: options.dealId, signatureId: options.signatureId });
}
