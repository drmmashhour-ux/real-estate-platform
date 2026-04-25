import { requireSignatureSystemV1 } from "@/lib/deals/pipeline-feature-guard";
import {
  ESIGNATURE_BROKER_APPROVAL_LINE,
  ESIGNATURE_EVIDENCE_DISCLAIMER,
  ESIGNATURE_NOTARY_DISCLAIMER,
} from "@/lib/esignature/legal-disclaimers";
import { getRequestClientMeta } from "@/lib/http/client-request-meta";
import { getGuestId } from "@/lib/auth/session";
import { applySignature, stripParticipantSecrets } from "@/modules/esignature/signature-envelope.service";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireSignatureSystemV1();
  if (gated) return gated;

  const { id: envelopeId } = await context.params;
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const participantId = typeof body.participantId === "string" ? body.participantId : "";
  const accessToken = typeof body.accessToken === "string" ? body.accessToken : "";
  if (!participantId || !accessToken) {
    return Response.json({ error: "participantId and accessToken required" }, { status: 400 });
  }

  const consentAccepted = body.consentAccepted === true;
  const documentViewed = body.documentViewed === true;
  const signerNameConfirmed = typeof body.signerNameConfirmed === "string" ? body.signerNameConfirmed : "";
  const otp = typeof body.otp === "string" ? body.otp : null;

  const userId = await getGuestId();
  const { ipAddress, userAgent } = getRequestClientMeta(request);

  try {
    const result = await applySignature({
      envelopeId,
      participantId,
      accessToken,
      consentAccepted,
      documentViewed,
      signerNameConfirmed,
      otp,
      actorUserId: userId,
      ipAddress,
      userAgent,
    });

    const envelope = await prisma.signatureEnvelope.findUnique({
      where: { id: envelopeId },
      include: { participants: { orderBy: { routingOrder: "asc" } }, events: { orderBy: { createdAt: "asc" } }, versions: true },
    });

    return Response.json({
      completed: result.completed,
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
