import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function getDocumentById(documentId: string) {
  return prisma.sellerDeclarationDraft.findUnique({
    where: { id: documentId },
    include: { signatures: true, documentVersions: { orderBy: { versionNumber: "desc" }, take: 1 } },
  });
}

export async function updateDocumentStatusRow(documentId: string, status: string) {
  return prisma.sellerDeclarationDraft.update({ where: { id: documentId }, data: { status: status as any } });
}

export async function createDocumentVersion(args: { documentId: string; payload: Record<string, unknown>; createdBy: string }) {
  const latest = await prisma.documentVersion.findFirst({ where: { documentId: args.documentId }, orderBy: { versionNumber: "desc" } });
  const versionNumber = (latest?.versionNumber ?? 0) + 1;
  return prisma.documentVersion.create({
    data: {
      documentId: args.documentId,
      versionNumber,
      payload: args.payload as Prisma.InputJsonValue,
      createdBy: args.createdBy,
    },
  });
}

export async function listDocumentVersions(documentId: string) {
  return prisma.documentVersion.findMany({ where: { documentId }, orderBy: { versionNumber: "desc" } });
}

export async function createAuditLog(args: { documentId: string; actorUserId: string; actionType: string; metadata?: Record<string, unknown> }) {
  return prisma.documentAuditLog.create({
    data: {
      documentId: args.documentId,
      actorUserId: args.actorUserId,
      actionType: args.actionType,
      metadata: (args.metadata ?? null) as Prisma.InputJsonValue,
    },
  });
}

export async function listAuditLogs(documentId: string) {
  return prisma.documentAuditLog.findMany({ where: { documentId }, orderBy: { createdAt: "desc" }, take: 200 });
}

export async function listApprovalQueue() {
  return prisma.sellerDeclarationDraft.findMany({
    orderBy: { updatedAt: "desc" },
    take: 300,
    include: {
      listing: {
        select: {
          title: true,
          address: true,
          city: true,
          riskScore: true,
        },
      },
    },
  });
}

export async function createSignatureReadiness(args: {
  documentId: string;
  signerName: string;
  signerEmail: string;
  negotiationVersionId?: string | null;
}) {
  return prisma.documentSignature.create({
    data: {
      documentId: args.documentId,
      signerName: args.signerName,
      signerEmail: args.signerEmail,
      status: "pending",
      negotiationVersionId: args.negotiationVersionId ?? null,
    },
  });
}
