import { prisma } from "@/lib/db";
import { mapFormByKey } from "@/modules/oaciq-mapper/map-form-router";
import { buildCanonicalDealShape } from "@/modules/oaciq-mapper/source-paths/canonical-deal-shape";
import { loadDealForMapper } from "@/lib/oaciq/load-deal-for-mapper";
import { buildSignableBundleFromMap } from "@/modules/signature-prep/document-prep.service";
import { docusignCreateEnvelope } from "./providers/docusign.real.adapter";
import { pandadocUploadPdfAndSend } from "./providers/pandadoc.real.adapter";
import { createSignatureSession } from "./signature-session.service";
import { productionPipelineFlags } from "@/config/feature-flags";

/**
 * End-to-end: broker-approved deal → PDF bundle → provider envelope → persisted session.
 * Does not replace official OACIQ instruments — draft PDF is broker-reviewed mapping output.
 */
export async function orchestrateProviderSend(input: {
  dealId: string;
  formKey: string;
  provider: "docusign" | "pandadoc";
  participantEmails: { name: string; role: string; email: string }[];
  actorUserId?: string | null;
}): Promise<{ sessionId: string; providerRef: string }> {
  const approval = await prisma.dealExecutionApproval.findFirst({
    where: { dealId: input.dealId },
    orderBy: { approvedAt: "desc" },
  });
  if (!approval) {
    throw new Error("Broker approval required before provider send.");
  }

  const deal = await loadDealForMapper(input.dealId);
  if (!deal) throw new Error("Deal not found");

  const canonical = buildCanonicalDealShape(deal);
  const map = mapFormByKey(input.formKey, canonical);
  const bundle = await buildSignableBundleFromMap({
    formLabel: input.formKey,
    map,
    participantRoles: input.participantEmails.map((p) => p.role),
  });

  const { sessionId } = await createSignatureSession({
    dealId: input.dealId,
    provider: input.provider,
    documentIds: bundle.documents.map((d) => d.documentId),
    participants: input.participantEmails.map((p) => ({
      name: p.name,
      role: p.role,
      email: p.email,
    })),
  });

  if (input.provider === "docusign" && productionPipelineFlags.signatureRealProvidersV1) {
    const accountId = process.env.DOCUSIGN_ACCOUNT_ID;
    if (!accountId) throw new Error("DOCUSIGN_ACCOUNT_ID required");

    const recipients = input.participantEmails.map((p, i) => ({
      email: p.email,
      name: p.name,
      roleName: p.role,
      routingOrder: String(i + 1),
      recipientId: String(i + 1),
    }));

    const env = await docusignCreateEnvelope({
      accountId,
      emailSubject: `LECIPM — Deal ${input.dealId} — ${input.formKey}`,
      documents: bundle.documents.map((d) => ({
        documentId: d.documentId,
        name: d.name,
        base64Pdf: d.base64Pdf,
      })),
      recipients,
      status: "sent",
    });

    await prisma.signatureSession.update({
      where: { id: sessionId },
      data: {
        status: "sent",
        providerSessionId: env.envelopeId,
        providerMetadata: {
          envelopeId: env.envelopeId,
          bundle: bundle.documents.map((d) => ({ id: d.documentId, name: d.name })),
        },
      },
    });

    for (let i = 0; i < input.participantEmails.length; i++) {
      const p = input.participantEmails[i];
      const part = await prisma.signatureParticipant.findFirst({
        where: { sessionId, email: p.email },
      });
      if (part) {
        await prisma.signatureParticipant.update({
          where: { id: part.id },
          data: { providerRecipientId: String(i + 1) },
        });
      }
    }

    await prisma.dealExecutionAuditLog.create({
      data: {
        dealId: input.dealId,
        actorUserId: input.actorUserId ?? null,
        actionKey: "signature_orchestrator_docusign_sent",
        payload: { sessionId, envelopeId: env.envelopeId },
      },
    });

    return { sessionId, providerRef: env.envelopeId };
  }

  if (input.provider === "pandadoc" && productionPipelineFlags.signatureRealProvidersV1) {
    const doc = bundle.documents[0];
    if (!doc) throw new Error("No PDF in bundle");
    const sent = await pandadocUploadPdfAndSend({
      name: doc.name,
      base64Pdf: doc.base64Pdf,
      recipients: input.participantEmails.map((p) => ({
        email: p.email,
        role: p.role,
        firstName: p.name.split(" ")[0],
        lastName: p.name.split(" ").slice(1).join(" ") || ".",
      })),
    });

    await prisma.signatureSession.update({
      where: { id: sessionId },
      data: {
        status: "sent",
        providerSessionId: sent.id,
        providerMetadata: { documentId: sent.id, status: sent.status },
      },
    });

    await prisma.dealExecutionAuditLog.create({
      data: {
        dealId: input.dealId,
        actorUserId: input.actorUserId ?? null,
        actionKey: "signature_orchestrator_pandadoc_sent",
        payload: { sessionId, documentId: sent.id },
      },
    });

    return { sessionId, providerRef: sent.id };
  }

  throw new Error("Real provider integration disabled or provider not supported.");
}
