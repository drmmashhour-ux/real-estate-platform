import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function clearGraphForProperty(propertyId: string) {
  const nodes = await prisma.legalGraphNode.findMany({ where: { entityType: "property", entityId: propertyId }, select: { id: true } });
  const ids = nodes.map((n) => n.id);
  if (ids.length) {
    await prisma.legalGraphEdge.deleteMany({ where: { OR: [{ fromNodeId: { in: ids } }, { toNodeId: { in: ids } }] } });
    await prisma.legalGraphIssue.deleteMany({ where: { propertyId } });
    await prisma.legalGraphNode.deleteMany({ where: { id: { in: ids } } });
  } else {
    await prisma.legalGraphIssue.deleteMany({ where: { propertyId } });
  }
}

export async function createGraphNode(input: { entityType: string; entityId: string; nodeType: string; payload?: Record<string, unknown> }) {
  return prisma.legalGraphNode.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      nodeType: input.nodeType,
      payload: (input.payload ?? null) as Prisma.InputJsonValue,
    },
  });
}

export async function createGraphEdge(input: { fromNodeId: string; toNodeId: string; edgeType: string; payload?: Record<string, unknown> }) {
  return prisma.legalGraphEdge.create({
    data: {
      fromNodeId: input.fromNodeId,
      toNodeId: input.toNodeId,
      edgeType: input.edgeType,
      payload: (input.payload ?? null) as Prisma.InputJsonValue,
    },
  });
}

export async function createGraphIssue(input: {
  propertyId: string;
  issueType: string;
  severity: "info" | "warning" | "critical";
  sourceNodeId: string;
  relatedNodeId?: string | null;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.legalGraphIssue.create({
    data: {
      propertyId: input.propertyId,
      issueType: input.issueType,
      severity: input.severity,
      sourceNodeId: input.sourceNodeId,
      relatedNodeId: input.relatedNodeId ?? null,
      title: input.title,
      message: input.message,
      metadata: (input.metadata ?? null) as Prisma.InputJsonValue,
    },
  });
}

export async function listGraphIssues(propertyId: string) {
  return prisma.legalGraphIssue.findMany({ where: { propertyId }, orderBy: { createdAt: "desc" } });
}

export async function getDocumentAndProperty(documentId: string) {
  return prisma.sellerDeclarationDraft.findUnique({
    where: { id: documentId },
    include: {
      listing: { select: { id: true, ownerId: true, riskScore: true, trustScore: true } },
      signatures: true,
      documentVersions: { orderBy: { versionNumber: "desc" }, take: 6 },
    },
  });
}
