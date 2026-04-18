import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { requireSignatureRealProvidersV1, requireSignatureSystemV1 } from "@/lib/deals/pipeline-feature-guard";
import { orchestrateProviderSend } from "@/modules/signature/signature-orchestrator.service";

export const dynamic = "force-dynamic";

/**
 * Broker-only: maps deal → PDF bundle → provider envelope (DocuSign / PandaDoc).
 * Requires broker execution approval and FEATURE_SIGNATURE_REAL_PROVIDERS_V1.
 */
export async function POST(request: Request) {
  const gated = requireSignatureSystemV1() ?? requireSignatureRealProvidersV1();
  if (gated) return gated;

  const body = (await request.json()) as {
    dealId?: string;
    formKey?: string;
    provider?: "docusign" | "pandadoc";
    participants?: { name: string; role: string; email: string }[];
  };

  if (!body.dealId || !body.formKey || !body.provider || !body.participants?.length) {
    return Response.json(
      { error: "dealId, formKey, provider, participants[] required" },
      { status: 400 },
    );
  }

  const auth = await authenticateBrokerDealRoute(body.dealId);
  if (!auth.ok) return auth.response;

  try {
    const result = await orchestrateProviderSend({
      dealId: body.dealId,
      formKey: body.formKey,
      provider: body.provider,
      participantEmails: body.participants,
      actorUserId: auth.userId,
    });
    return Response.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Send failed";
    return Response.json({ error: msg }, { status: 400 });
  }
}
