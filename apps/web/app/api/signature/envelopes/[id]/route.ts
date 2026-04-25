import { requireAuthUser, requireBrokerOrAdmin } from "@/lib/deals/guard-pipeline-deal";
import { requireSignatureSystemV1 } from "@/lib/deals/pipeline-feature-guard";
import {
  ESIGNATURE_BROKER_APPROVAL_LINE,
  ESIGNATURE_EVIDENCE_DISCLAIMER,
  ESIGNATURE_NOTARY_DISCLAIMER,
} from "@/lib/esignature/legal-disclaimers";
import {
  getSignatureEnvelopeDetail,
  getSignatureEnvelopeForSigner,
  stripParticipantSecrets,
} from "@/modules/esignature/signature-envelope.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireSignatureSystemV1();
  if (gated) return gated;

  const { id: envelopeId } = await context.params;
  const url = new URL(request.url);
  const signerParticipantId = url.searchParams.get("participantId");
  const accessToken = url.searchParams.get("accessToken");

  if (signerParticipantId && accessToken) {
    try {
      const env = await getSignatureEnvelopeForSigner(envelopeId, signerParticipantId, accessToken);
      if (!env) return Response.json({ error: "Not found" }, { status: 404 });
      return Response.json({
        envelope: {
          ...env,
          participants: env.participants,
        },
        signingSelf: stripParticipantSecrets(env.signingSelf),
        disclaimers: {
          notary: ESIGNATURE_NOTARY_DISCLAIMER,
          evidence: ESIGNATURE_EVIDENCE_DISCLAIMER,
          brokerApproval: ESIGNATURE_BROKER_APPROVAL_LINE,
        },
      });
    } catch (e) {
      return Response.json({ error: e instanceof Error ? e.message : "Forbidden" }, { status: 403 });
    }
  }

  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  if (!requireBrokerOrAdmin(auth.role)) {
    return Response.json({ error: "Broker or admin only" }, { status: 403 });
  }

  try {
    const env = await getSignatureEnvelopeDetail(envelopeId, auth.userId, auth.role);
    if (!env) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({
      envelope: {
        ...env,
        participants: env.participants.map((p) => stripParticipantSecrets(p)),
      },
      disclaimers: {
        notary: ESIGNATURE_NOTARY_DISCLAIMER,
        evidence: ESIGNATURE_EVIDENCE_DISCLAIMER,
        brokerApproval: ESIGNATURE_BROKER_APPROVAL_LINE,
      },
    });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Forbidden" }, { status: 403 });
  }
}
