import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { appendAuditProof } from "./transaction-audit-proof.service";
import { logTimelineEvent } from "./transaction-timeline.service";

const TAG = "[transaction.notary]";

export async function prepareNotaryPackage(transactionId: string) {
  const financial = await prisma.lecipmSdFinancialApproval.findUnique({ where: { transactionId } });
  if (!financial || financial.approvalStatus !== "APPROVED") {
    throw new Error("Financial approval must be APPROVED before preparing notary package");
  }

  const docs = await prisma.lecipmSdDocument.findMany({
    where: {
      transactionId,
      status: { in: ["FINAL", "SIGNED"] },
    },
    select: { id: true, title: true, status: true, documentType: true },
  });

  if (docs.length === 0) {
    throw new Error("No FINAL or SIGNED documents to include");
  }

  const payload = {
    transactionId,
    documentIds: docs.map((d) => d.id),
    documents: docs,
    preparedAt: new Date().toISOString(),
  };

  const pkg = await prisma.lecipmSdNotaryPackage.upsert({
    where: { transactionId },
    create: {
      transactionId,
      packageStatus: "READY",
      documentIdsJson: docs.map((d) => d.id) as object,
      payloadJson: payload as object,
    },
    update: {
      packageStatus: "READY",
      documentIdsJson: docs.map((d) => d.id) as object,
      payloadJson: payload as object,
    },
  });

  logInfo(`${TAG}`, { transactionId, docCount: docs.length });
  return { package: pkg, payload };
}

export async function sendNotaryPackage(transactionId: string, notaryName?: string | null, notaryEmail?: string | null) {
  const prepared = await prisma.lecipmSdNotaryPackage.findUnique({ where: { transactionId } });
  if (!prepared || prepared.packageStatus === "PENDING") {
    await prepareNotaryPackage(transactionId);
  }

  const pkg = await prisma.lecipmSdNotaryPackage.update({
    where: { transactionId },
    data: {
      packageStatus: "SENT",
      sentAt: new Date(),
      notaryName: notaryName?.slice(0, 256) ?? undefined,
      notaryEmail: notaryEmail?.slice(0, 320) ?? undefined,
    },
  });

  await logTimelineEvent(prisma, transactionId, "NOTARY_PACKAGE_SENT", `Notary package sent${notaryEmail ? ` (${notaryEmail})` : ""}`);
  await appendAuditProof({
    transactionId,
    eventType: "NOTARY_PACKAGE_SENT",
    payload: { notaryEmail: notaryEmail ?? null },
  });
  logInfo(`${TAG}`, { transactionId, action: "send" });
  return pkg;
}

export async function getNotaryPackage(transactionId: string) {
  return prisma.lecipmSdNotaryPackage.findUnique({ where: { transactionId } });
}
