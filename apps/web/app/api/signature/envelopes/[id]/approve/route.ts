import { requireAuthUser, requireBrokerOrAdmin } from "@/lib/deals/guard-pipeline-deal";
import { requireSignatureSystemV1 } from "@/lib/deals/pipeline-feature-guard";
import {
  ESIGNATURE_BROKER_APPROVAL_LINE,
  ESIGNATURE_EVIDENCE_DISCLAIMER,
  ESIGNATURE_NOTARY_DISCLAIMER,
} from "@/lib/esignature/legal-disclaimers";
import { getRequestClientMeta } from "@/lib/http/client-request-meta";
import { approveSignatureEnvelope, stripParticipantSecrets } from "@/modules/esignature/signature-envelope.service";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Explicit broker approval gate before dispatch (alternative to send.autoApprove). */
export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireSignatureSystemV1();
  if (gated) return gated;

  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  if (!requireBrokerOrAdmin(auth.role)) {
    return Response.json({ error: "Broker or admin only" }, { status: 403 });
  }

  const { id: envelopeId } = await context.params;
  const { ipAddress, userAgent } = getRequestClientMeta(_request);

  try {
    await approveSignatureEnvelope({
      envelopeId,
      brokerUserId: auth.userId,
      role: auth.role,
      ipAddress,
      userAgent,
    });
    const envelope = await prisma.signatureEnvelope.findUnique({
      where: { id: envelopeId },
      include: { participants: { orderBy: { routingOrder: "asc" } }, events: { orderBy: { createdAt: "asc" } }, versions: true },
    });
    return Response.json({
      ok: true,
      envelope: envelope
        ? {
            ...envelope,
            participants: envelope.participants.map((p) => stripParticipantSecrets(p)),
          }
        : null,
      disclaimers: {
        notary: ESIGNATURE_NOTARY_DISCLAIMER,
        evidence: ESIGNATURE_EVIDENCE_DISCLAIMER,
        brokerApproval: ESIGNATURE_BROKER_APPROVAL_LINE,
      },
    });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
