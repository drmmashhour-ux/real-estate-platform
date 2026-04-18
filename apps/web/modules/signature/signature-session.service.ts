import { prisma } from "@/lib/db";
import type { SignatureProviderId } from "./signature.types";

export async function createSignatureSession(input: {
  dealId: string;
  provider: SignatureProviderId;
  documentIds: string[];
  participants: { name: string; role: string; email?: string | null }[];
}): Promise<{ sessionId: string }> {
  const session = await prisma.signatureSession.create({
    data: {
      dealId: input.dealId,
      status: "draft",
      provider: input.provider,
      documentIds: input.documentIds,
      participants: {
        create: input.participants.map((p) => ({
          name: p.name,
          role: p.role,
          email: p.email ?? null,
          status: "pending",
        })),
      },
    },
    select: { id: true },
  });
  await prisma.dealExecutionAuditLog.create({
    data: {
      dealId: input.dealId,
      actorUserId: null,
      actionKey: "signature_session_created",
      payload: { sessionId: session.id, provider: input.provider },
    },
  });
  return { sessionId: session.id };
}
