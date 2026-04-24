import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { requireSignatureSystemV1 } from "@/lib/deals/pipeline-feature-guard";
import { validateBeforeSignature } from "@/lib/production-guard/signature-gate";
import { createDealSignatureSession } from "@/modules/signature/signature.service";
import type { SignatureProviderId } from "@/modules/signature/signature.types";

export const dynamic = "force-dynamic";

const PROVIDERS = new Set<SignatureProviderId>(["docusign", "pandadoc", "adobe_sign", "manual"]);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireSignatureSystemV1();
  if (gated) return gated;
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as {
    provider?: string;
    documentIds?: string[];
    participants?: { name: string; role: string; email?: string | null }[];
    productionGuard?: {
      formKey?: string;
      formVersion?: string;
      formPayload?: unknown;
    };
  };
  const provider = body.provider as SignatureProviderId;
  if (!provider || !PROVIDERS.has(provider)) {
    return Response.json({ error: "Invalid provider" }, { status: 400 });
  }
  const documentIds = body.documentIds ?? [];
  const participants = body.participants ?? [];
  if (!participants.length) {
    return Response.json({ error: "At least one participant required" }, { status: 400 });
  }

  const gate = await validateBeforeSignature({
    deal: auth.deal,
    userId: auth.userId,
    formKey: body.productionGuard?.formKey,
    formVersion: body.productionGuard?.formVersion,
    formPayload: body.productionGuard?.formPayload,
  });
  if (!gate.ok) {
    return Response.json(
      {
        error: "SIGNATURE_GATE_BLOCKED",
        errors: gate.errors,
        blockingReasons: gate.blockingReasons,
        productionGuard: true,
      },
      { status: 403 },
    );
  }

  const result = await createDealSignatureSession({
    dealId,
    provider,
    documentIds,
    participants,
  });

  return Response.json({
    ...result,
    disclaimer: "Signature orchestration is separate from OACIQ publisher execution — broker remains accountable.",
  });
}
