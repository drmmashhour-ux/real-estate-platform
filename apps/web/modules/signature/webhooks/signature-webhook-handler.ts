import { prisma } from "@/lib/db";
import { asInputJsonValue } from "@/lib/prisma/as-input-json";
import { logSignatureTiming } from "@/modules/analytics/signature-closing-analytics.service";
import { syncPipelineAfterSignature } from "@/modules/deal-execution/deal-execution.service";
import type { NormalizedSignEvent } from "./docusign.webhook";
import type { PandaDocWebhookEvent } from "./pandadoc.webhook";

async function audit(dealId: string, actionKey: string, payload: Record<string, unknown>) {
  await prisma.dealExecutionAuditLog.create({
    data: { dealId, actorUserId: null, actionKey, payload: asInputJsonValue(payload) },
  });
}

export async function applyDocuSignEvents(events: NormalizedSignEvent[]): Promise<{ updatedSessions: number }> {
  let updated = 0;
  for (const ev of events) {
    if (!("envelopeId" in ev) || !ev.envelopeId) continue;
    const session = await prisma.signatureSession.findFirst({
      where: { provider: "docusign", providerSessionId: ev.envelopeId },
      include: { participants: true, deal: true },
    });
    if (!session) continue;

    if (ev.type === "envelope_sent") {
      await prisma.signatureSession.update({
        where: { id: session.id },
        data: { status: "sent", providerMetadata: { ...(session.providerMetadata as object), lastEvent: ev.type } },
      });
      await audit(session.dealId, "docusign_webhook_sent", { sessionId: session.id, envelopeId: ev.envelopeId });
      updated++;
    }

    if (ev.type === "recipient_completed" && ev.recipientEmail) {
      const p = session.participants.find((x) => x.email?.toLowerCase() === ev.recipientEmail?.toLowerCase());
      if (p) {
        await prisma.signatureParticipant.update({
          where: { id: p.id },
          data: { status: "signed", signedAt: new Date() },
        });
        await audit(session.dealId, "docusign_recipient_signed", { participantId: p.id });
        updated++;
      }
    }

    if (ev.type === "envelope_completed") {
      await prisma.signatureSession.update({
        where: { id: session.id },
        data: { status: "completed" },
      });
      for (const p of session.participants) {
        if (p.status !== "signed") {
          await prisma.signatureParticipant.update({
            where: { id: p.id },
            data: { status: "signed", signedAt: p.signedAt ?? new Date() },
          });
        }
      }
      await audit(session.dealId, "docusign_envelope_completed", { sessionId: session.id });
      await syncPipelineAfterSignature(session.dealId);
      await logSignatureTiming({
        dealId: session.dealId,
        sessionId: session.id,
        eventKey: "signature_completed",
        msSinceSessionCreate: Date.now() - session.createdAt.getTime(),
      });
      updated++;
    }

    if (ev.type === "envelope_declined") {
      await prisma.signatureSession.update({
        where: { id: session.id },
        data: { status: "declined" },
      });
      await audit(session.dealId, "docusign_envelope_declined", { sessionId: session.id });
      updated++;
    }
  }
  return { updatedSessions: updated };
}

export async function applyPandaDocEvents(events: PandaDocWebhookEvent[]): Promise<{ updatedSessions: number }> {
  let updated = 0;
  for (const ev of events) {
    if (!ev.documentId) continue;
    const session = await prisma.signatureSession.findFirst({
      where: { provider: "pandadoc", providerSessionId: ev.documentId },
      include: { participants: true },
    });
    if (!session) continue;

    const t = ev.type ?? "";
    const st = ev.status ?? "";

    if (t.includes("document.sent") || st.includes("document.sent")) {
      await prisma.signatureSession.update({
        where: { id: session.id },
        data: { status: "sent" },
      });
      await audit(session.dealId, "pandadoc_document_sent", { sessionId: session.id });
      updated++;
    }

    if (t.includes("document.viewed") || st.includes("document.viewed")) {
      await prisma.signatureSession.update({
        where: { id: session.id },
        data: { status: "in_progress" },
      });
      await audit(session.dealId, "pandadoc_document_viewed", { sessionId: session.id });
      updated++;
    }

    if (
      (t.includes("recipient_completed") || t.includes("document.recipient_completed")) &&
      ev.recipientEmail
    ) {
      const p = session.participants.find((x) => x.email?.toLowerCase() === ev.recipientEmail?.toLowerCase());
      if (p) {
        await prisma.signatureParticipant.update({
          where: { id: p.id },
          data: { status: "signed", signedAt: new Date() },
        });
        await audit(session.dealId, "pandadoc_recipient_signed", { participantId: p.id });
        await syncPipelineAfterSignature(session.dealId);
        updated++;
      }
    }

    if (t.includes("document.completed") || st === "document.completed") {
      await prisma.signatureSession.update({
        where: { id: session.id },
        data: { status: "completed" },
      });
      await audit(session.dealId, "pandadoc_document_completed", { sessionId: session.id });
      await syncPipelineAfterSignature(session.dealId);
      await logSignatureTiming({
        dealId: session.dealId,
        sessionId: session.id,
        eventKey: "signature_completed",
        msSinceSessionCreate: Date.now() - session.createdAt.getTime(),
      });
      updated++;
    }

    if (t.includes("document.declined") || t.includes("document.voided") || st.includes("declined")) {
      await prisma.signatureSession.update({
        where: { id: session.id },
        data: { status: "declined" },
      });
      await audit(session.dealId, "pandadoc_document_declined", { sessionId: session.id });
      updated++;
    }
  }
  return { updatedSessions: updated };
}
