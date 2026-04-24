import type { DigitalSignatureCaptureType, DigitalSignatureSignerRole, PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { asInputJsonValue } from "@/lib/prisma/as-input-json";
import { legalDocumentsEngineEnabled } from "@/modules/legal-documents/legal-documents.domain";
import {
  assertCapitalAccess,
  assertDealPartySignAccess,
} from "@/modules/legal-documents/legal-documents-access";
import { getLegalDocumentArtifact } from "@/modules/legal-documents/legal-documents.service";
import { DIGITAL_SIGN_CONSENT_TEXT_EN, DIGITAL_SIGN_CONSENT_TEXT_VERSION } from "./consent-text";
import { canonicalDocumentSha256, recordEnvelopeSha256 } from "./document-hash";
import { buildLockedPdfBytes } from "./locked-pdf.service";

async function resolveSignerRole(input: {
  artifact: {
    dealId: string | null;
    capitalDealId: string | null;
  };
  userId: string;
  platformRole: PlatformRole;
}): Promise<DigitalSignatureSignerRole> {
  if (input.artifact.dealId) {
    const deal = await prisma.deal.findUnique({
      where: { id: input.artifact.dealId },
      select: { brokerId: true, buyerId: true, sellerId: true },
    });
    if (!deal) throw new Error("Deal not found.");
    if (deal.brokerId === input.userId) return "BROKER";
    if (deal.buyerId === input.userId || deal.sellerId === input.userId) return "CLIENT";
    if (input.platformRole === "ADMIN") return "BROKER";
    throw new Error("You are not a party authorized to sign this deal-linked document.");
  }
  if (input.artifact.capitalDealId) {
    const cap = await prisma.amfCapitalDeal.findUnique({
      where: { id: input.artifact.capitalDealId },
      select: { sponsorUserId: true },
    });
    if (!cap) throw new Error("Capital deal not found.");
    if (cap.sponsorUserId === input.userId) return "BROKER";
    if (input.platformRole === "ADMIN") return "BROKER";
    throw new Error("Only the sponsor or an administrator may sign this investment document.");
  }
  if (input.platformRole === "ADMIN") return "BROKER";
  throw new Error("Cannot resolve signer role for this document.");
}

export async function createDigitalSignatureRecord(input: {
  artifactId: string;
  userId: string;
  role: PlatformRole;
  signatureType: DigitalSignatureCaptureType;
  consentAcknowledged: boolean;
  consentTextQuoted: string;
  ipAddress: string | null;
  userAgent: string | null;
  drawnPayload?: unknown;
  /** Optional client-reported ceremony step stored inside signature_completed payload. */
  auditEventKey?: "document_viewed" | "ceremony_started";
}): Promise<{ signatureId: string; documentHash: string }> {
  if (!legalDocumentsEngineEnabled()) throw new Error("Legal documents engine is disabled.");

  if (!input.consentAcknowledged) throw new Error("Consent is required to sign.");
  if (input.consentTextQuoted.trim() !== DIGITAL_SIGN_CONSENT_TEXT_EN) {
    throw new Error("Consent text must match the mandated English sentence exactly.");
  }

  const artifact = await prisma.lecipmLegalDocumentArtifact.findUnique({
    where: { id: input.artifactId },
    include: { templateVersion: true },
  });
  if (!artifact) throw new Error("Document not found.");
  if (artifact.status !== "AWAITING_APPROVAL" && artifact.status !== "DRAFT") {
    throw new Error("Signing is only allowed while the document awaits approval.");
  }

  if (artifact.dealId) await assertDealPartySignAccess(artifact.dealId, input.userId, input.role);
  if (artifact.capitalDealId) await assertCapitalAccess(artifact.capitalDealId, input.userId, input.role);

  const signerRole = await resolveSignerRole({
    artifact: { dealId: artifact.dealId, capitalDealId: artifact.capitalDealId },
    userId: input.userId,
    platformRole: input.role,
  });

  const documentHash = canonicalDocumentSha256({
    templateVersionId: artifact.templateVersionId,
    templateVersionNumber: artifact.templateVersion.versionNumber,
    renderedHtml: artifact.renderedHtml,
  });

  const signedAt = new Date();
  const signedAtIso = signedAt.toISOString();

  const existing = await prisma.digitalSignature.findFirst({
    where: {
      legalDocumentArtifactId: artifact.id,
      signedByUserId: input.userId,
      signerRole,
      documentHash,
    },
  });
  if (existing) {
    return { signatureId: existing.id, documentHash };
  }

  const recordHash = recordEnvelopeSha256({
    documentHash,
    signedByUserId: input.userId,
    signedAtIso,
    consentTextVersion: DIGITAL_SIGN_CONSENT_TEXT_VERSION,
    consentAcknowledged: true,
    ipAddress: input.ipAddress ?? "",
    userAgent: input.userAgent ?? "",
  });

  const sig = await prisma.digitalSignature.create({
    data: {
      legalDocumentArtifactId: artifact.id,
      signedByUserId: input.userId,
      signerRole,
      signatureType: input.signatureType,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent?.slice(0, 500) ?? null,
      documentHash,
      recordHash,
      templateVersionNumber: artifact.templateVersion.versionNumber,
      consentTextVersion: DIGITAL_SIGN_CONSENT_TEXT_VERSION,
      consentAcknowledged: true,
      drawnPayload:
        input.drawnPayload === undefined ? undefined : (asInputJsonValue(input.drawnPayload as Record<string, unknown>) as object),
    },
  });

  await prisma.digitalSignatureAuditEvent.create({
    data: {
      digitalSignatureId: sig.id,
      eventKey: "signature_completed",
      ipAddress: input.ipAddress,
      userAgent: input.userAgent?.slice(0, 500) ?? null,
      payload: asInputJsonValue({
        documentHash,
        recordHash,
        templateVersionNumber: artifact.templateVersion.versionNumber,
        signatureType: input.signatureType,
        signerRole,
        priorStep: input.auditEventKey ?? null,
      }),
    },
  });

  if (artifact.dealId) {
    await prisma.dealExecutionAuditLog
      .create({
        data: {
          dealId: artifact.dealId,
          actorUserId: input.userId,
          actionKey: "digital_signature.recorded",
          payload: asInputJsonValue({
            artifactId: artifact.id,
            signatureId: sig.id,
            signerRole,
            documentHash,
          }),
        },
      })
      .catch(() => undefined);
  }

  await refreshLockedPdfForArtifact(artifact.id);

  return { signatureId: sig.id, documentHash };
}

export async function refreshLockedPdfForArtifact(artifactId: string): Promise<void> {
  const artifact = await prisma.lecipmLegalDocumentArtifact.findUnique({
    where: { id: artifactId },
    include: {
      templateVersion: { include: { template: true } },
      digitalSignatures: { orderBy: { signedAt: "asc" } },
    },
  });
  if (!artifact || artifact.digitalSignatures.length === 0) return;

  const userIds = [...new Set(artifact.digitalSignatures.map((s) => s.signedByUserId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const signerSummaries = artifact.digitalSignatures.map((s) => {
    const u = userMap.get(s.signedByUserId);
    return { userId: s.signedByUserId, name: u?.name ?? null, email: u?.email ?? "" };
  });

  const bytes = await buildLockedPdfBytes({
    title: `${artifact.templateVersion.template.name} · ${artifact.kind}`,
    documentKind: artifact.kind,
    bodyHtml: artifact.renderedHtml,
    signatures: artifact.digitalSignatures,
    signerSummaries,
  });

  await prisma.lecipmLegalDocumentArtifact.update({
    where: { id: artifactId },
    data: {
      lockedPdfBytes: Buffer.from(bytes),
      lockedPdfGeneratedAt: new Date(),
    },
  });
}

export async function exportSignatureAuditJson(input: {
  artifactId: string;
  userId: string;
  role: PlatformRole;
}): Promise<Record<string, unknown> | null> {
  const artifact = await getLegalDocumentArtifact({
    artifactId: input.artifactId,
    userId: input.userId,
    role: input.role,
  });
  if (!artifact) return null;

  const sigs = await prisma.digitalSignature.findMany({
    where: { legalDocumentArtifactId: input.artifactId },
    orderBy: { signedAt: "asc" },
    include: { auditEvents: { orderBy: { createdAt: "asc" } } },
  });

  const expectedHash = canonicalDocumentSha256({
    templateVersionId: artifact.templateVersionId,
    templateVersionNumber: artifact.templateVersion.versionNumber,
    renderedHtml: artifact.renderedHtml,
  });

  return {
    artifactId: artifact.id,
    kind: artifact.kind,
    domain: artifact.domain,
    templateVersionNumber: artifact.templateVersion.versionNumber,
    canonicalDocumentSha256: expectedHash,
    signatures: sigs.map((s) => ({
      id: s.id,
      signerRole: s.signerRole,
      signatureType: s.signatureType,
      signedByUserId: s.signedByUserId,
      documentHash: s.documentHash,
      recordHash: s.recordHash,
      signedAt: s.signedAt.toISOString(),
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      auditEvents: s.auditEvents.map((e) => ({
        eventKey: e.eventKey,
        createdAt: e.createdAt.toISOString(),
        payload: e.payload,
      })),
    })),
    disclaimer:
      "Audit export is an operational record from LECIPM — admissibility and evidentiary weight depend on applicable law and procedure.",
  };
}

export async function getLockedPdfBytes(input: {
  artifactId: string;
  userId: string;
  role: PlatformRole;
}): Promise<Buffer | null> {
  const artifact = await getLegalDocumentArtifact({
    artifactId: input.artifactId,
    userId: input.userId,
    role: input.role,
  });
  if (!artifact) return null;
  if (artifact.lockedPdfBytes && artifact.lockedPdfBytes.length > 0) {
    return Buffer.from(artifact.lockedPdfBytes);
  }
  await refreshLockedPdfForArtifact(input.artifactId);
  const again = await prisma.lecipmLegalDocumentArtifact.findUnique({
    where: { id: input.artifactId },
    select: { lockedPdfBytes: true },
  });
  if (!again?.lockedPdfBytes) return null;
  return Buffer.from(again.lockedPdfBytes);
}
