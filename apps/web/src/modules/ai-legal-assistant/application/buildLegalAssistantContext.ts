import type { LegalAssistantContext } from "@/src/modules/ai-legal-assistant/domain/legalAssistant.types";
import { retrieveLegalAssistantKnowledge } from "@/src/modules/ai-legal-assistant/infrastructure/legalAssistantRetrievalService";
import { getDocumentContext } from "@/src/modules/ai-legal-assistant/tools/getDocumentContext";
import { getValidationSummary } from "@/src/modules/ai-legal-assistant/tools/getValidationSummary";
import { getAuditTimeline } from "@/src/modules/ai-legal-assistant/tools/getAuditTimeline";
import { getSignatureStatus } from "@/src/modules/ai-legal-assistant/tools/getSignatureStatus";
import { prisma } from "@/lib/db";
import { getLegalGraphSummary } from "@/src/modules/legal-intelligence-graph/application/getLegalGraphSummary";
import { buildLegalGraph } from "@/src/modules/legal-intelligence-graph/application/buildLegalGraph";

export async function buildLegalAssistantContext(documentId: string, userId: string, queryHint?: string): Promise<LegalAssistantContext> {
  const [doc, validation, audit, signatures, versions] = await Promise.all([
    getDocumentContext(documentId, userId),
    getValidationSummary(documentId, userId),
    getAuditTimeline(documentId, userId),
    getSignatureStatus(documentId, userId),
    prisma.documentVersion.findMany({ where: { documentId }, orderBy: { versionNumber: "desc" }, take: 12 }),
  ]);

  const sectionKeys = validation.sectionStatuses.map((s) => s.sectionKey);
  const graphBuild = await buildLegalGraph({ documentId }).catch(() => null);
  const graphSummary = graphBuild ? await getLegalGraphSummary(graphBuild.propertyId).catch(() => null) : null;
  const knowledge = await retrieveLegalAssistantKnowledge(sectionKeys, queryHint);
  if (graphSummary) {
    knowledge.push(`graph:file_health:${graphSummary.fileHealth}`);
    for (const b of graphSummary.blockingIssues.slice(0, 4)) knowledge.push(`graph:blocker:${b}`);
  }

  return {
    documentId,
    status: doc.status,
    payload: (doc.draftPayload ?? {}) as Record<string, unknown>,
    validation,
    audit: audit.map((a) => ({
      id: a.id,
      actionType: a.actionType,
      actorUserId: a.actorUserId,
      metadata: (a.metadata ?? null) as Record<string, unknown> | null,
      createdAt: a.createdAt,
    })),
    signatures: signatures.map((s) => ({ id: s.id, signerName: s.signerName, signerEmail: s.signerEmail, status: s.status, signedAt: s.signedAt })),
    versions: versions.map((v) => ({ id: v.id, versionNumber: v.versionNumber, createdAt: v.createdAt })),
    knowledge,
  };
}
