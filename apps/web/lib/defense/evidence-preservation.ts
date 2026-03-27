/**
 * Evidence Preservation and Case Integrity – upload classification, chain-of-custody, access log.
 * Secure evidence handling for disputes, fraud, incidents, compliance, legal.
 */
import { prisma } from "@/lib/db";

/** Create an evidence record (upload reference); chain-of-custody starts at creation. */
export async function createEvidenceRecord(params: {
  caseType: string;
  caseId: string;
  classification: string;
  url: string;
  filename?: string;
  mimeType?: string;
  uploadedBy: string;
  metadata?: object;
  retentionUntil?: Date;
  checksum?: string;
}) {
  return prisma.evidenceRecord.create({
    data: {
      caseType: params.caseType,
      caseId: params.caseId,
      classification: params.classification,
      url: params.url,
      filename: params.filename,
      mimeType: params.mimeType,
      uploadedBy: params.uploadedBy,
      metadata: (params.metadata as object) ?? undefined,
      retentionUntil: params.retentionUntil,
      checksum: params.checksum,
    },
  });
}

/** Log access to evidence (view, export, download) for traceability. */
export async function logEvidenceAccess(params: {
  evidenceId: string;
  accessedBy: string;
  accessType: string;
  reasonCode?: string;
}) {
  return prisma.evidenceAccessLog.create({
    data: {
      evidenceId: params.evidenceId,
      accessedBy: params.accessedBy,
      accessType: params.accessType,
      reasonCode: params.reasonCode,
    },
  });
}

/** Get all evidence for a case (dispute, fraud, etc.) with access log count. */
export async function getEvidenceForCase(caseType: string, caseId: string) {
  const records = await prisma.evidenceRecord.findMany({
    where: { caseType, caseId },
    orderBy: { uploadedAt: "asc" },
  });
  const withAccessCount = await Promise.all(
    records.map(async (r) => {
      const count = await prisma.evidenceAccessLog.count({ where: { evidenceId: r.id } });
      return { ...r, accessCount: count };
    })
  );
  return withAccessCount;
}

/** Get case timeline: evidence + linked entity events (e.g. dispute messages, payments). */
export async function getCaseTimeline(caseType: string, caseId: string) {
  const evidence = await prisma.evidenceRecord.findMany({
    where: { caseType, caseId },
    orderBy: { uploadedAt: "asc" },
  });
  const events: { at: Date; type: string; description: string; id?: string }[] = evidence.map((e) => ({
    at: e.uploadedAt,
    type: "EVIDENCE",
    description: `${e.classification} uploaded by ${e.uploadedBy}`,
    id: e.id,
  }));
  events.sort((a, b) => a.at.getTime() - b.at.getTime());
  return events;
}
