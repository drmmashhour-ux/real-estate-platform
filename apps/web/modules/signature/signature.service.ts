import { prisma } from "@/lib/db";
import { createSignatureSession } from "./signature-session.service";
import { getLatestSignatureSummary } from "./signature-tracking.service";
import type { SignatureProviderId } from "./signature.types";
import { manualSignatureAdapter } from "./providers/manual-signature.adapter";

export async function createDealSignatureSession(input: {
  dealId: string;
  provider: SignatureProviderId;
  documentIds: string[];
  participants: { name: string; role: string; email?: string | null }[];
}) {
  const { sessionId } = await createSignatureSession(input);
  if (input.provider === "manual") {
    await manualSignatureAdapter.createSession({
      dealId: input.dealId,
      sessionId,
      documentIds: input.documentIds,
    });
  }
  await prisma.signatureSession.update({
    where: { id: sessionId },
    data: { status: "pending_send" },
  });
  return { sessionId };
}

export async function sendSignatureSession(sessionId: string, dealId: string) {
  const session = await prisma.signatureSession.findFirst({
    where: { id: sessionId, dealId },
    include: { participants: true },
  });
  if (!session) return { ok: false as const, message: "Session not found" };

  await prisma.signatureSession.update({
    where: { id: sessionId },
    data: { status: "sent" },
  });
  await prisma.dealExecutionAuditLog.create({
    data: {
      dealId,
      actorUserId: null,
      actionKey: "signature_session_sent",
      payload: { sessionId, provider: session.provider },
    },
  });
  return { ok: true as const, sessionId };
}

export { getLatestSignatureSummary };
