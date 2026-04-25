import { requireAuthUser, requireBrokerOrAdmin } from "@/lib/deals/guard-pipeline-deal";
import { requireSignatureSystemV1 } from "@/lib/deals/pipeline-feature-guard";
import {
  ESIGNATURE_BROKER_APPROVAL_LINE,
  ESIGNATURE_EVIDENCE_DISCLAIMER,
  ESIGNATURE_NOTARY_DISCLAIMER,
} from "@/lib/esignature/legal-disclaimers";
import { getRequestClientMeta } from "@/lib/http/client-request-meta";
import { sendSignatureEnvelope, stripParticipantSecrets } from "@/modules/esignature/signature-envelope.service";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireSignatureSystemV1();
  if (gated) return gated;

  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  if (!requireBrokerOrAdmin(auth.role)) {
    return Response.json({ error: "Broker or admin only" }, { status: 403 });
  }

  const { id: envelopeId } = await context.params;
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const { ipAddress, userAgent } = getRequestClientMeta(request);

  try {
    const { signerTokens } = await sendSignatureEnvelope({
      envelopeId,
      brokerUserId: auth.userId,
      role: auth.role,
      canonicalPdfBase64: typeof body.canonicalPdfBase64 === "string" ? body.canonicalPdfBase64 : null,
      canonicalPdfUrl: typeof body.canonicalPdfUrl === "string" ? body.canonicalPdfUrl : null,
      autoApprove: body.autoApprove === true,
      ipAddress,
      userAgent,
    });

    const envelope = await prisma.signatureEnvelope.findUnique({
      where: { id: envelopeId },
      include: { participants: { orderBy: { routingOrder: "asc" } }, events: { orderBy: { createdAt: "asc" } }, versions: true },
    });

    return Response.json({
      signerTokens,
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
      notice:
        "Distribute each accessToken to the matching signer through a secure channel. Tokens are shown once. OTP values (if any) must be delivered out-of-band.",
    });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
