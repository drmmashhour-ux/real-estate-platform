import { requireAuthUser, requireBrokerOrAdmin } from "@/lib/deals/guard-pipeline-deal";
import { requireSignatureSystemV1 } from "@/lib/deals/pipeline-feature-guard";
import {
  ESIGNATURE_BROKER_APPROVAL_LINE,
  ESIGNATURE_EVIDENCE_DISCLAIMER,
  ESIGNATURE_NOTARY_DISCLAIMER,
} from "@/lib/esignature/legal-disclaimers";
import { getRequestClientMeta } from "@/lib/http/client-request-meta";
import { createSignatureEnvelope, SOURCE_KINDS, type SourceDocumentKind } from "@/modules/esignature/signature-envelope.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const gated = requireSignatureSystemV1();
  if (gated) return gated;

  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  if (!requireBrokerOrAdmin(auth.role)) {
    return Response.json({ error: "Broker or admin only" }, { status: 403 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const dealId = typeof body.dealId === "string" ? body.dealId : "";
  const sourceDocumentId = typeof body.sourceDocumentId === "string" ? body.sourceDocumentId : "";
  const sourceDocumentKind = typeof body.sourceDocumentKind === "string" ? body.sourceDocumentKind : "";
  const title = typeof body.title === "string" ? body.title : undefined;
  const rawParts = Array.isArray(body.participants) ? body.participants : [];

  if (!dealId || !sourceDocumentId) {
    return Response.json({ error: "dealId and sourceDocumentId required" }, { status: 400 });
  }
  if (!SOURCE_KINDS.includes(sourceDocumentKind as SourceDocumentKind)) {
    return Response.json({ error: `sourceDocumentKind must be one of: ${SOURCE_KINDS.join(", ")}` }, { status: 400 });
  }

  const participants: Array<{
    email: string;
    displayName: string;
    signerRole: string;
    routingOrder: number;
    userId?: string | null;
    requiresOtp?: boolean;
  }> = [];

  for (const r of rawParts) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    const email = typeof o.email === "string" ? o.email : "";
    const displayName = typeof o.displayName === "string" ? o.displayName : "";
    const signerRole = typeof o.signerRole === "string" ? o.signerRole : "other";
    const routingOrder = typeof o.routingOrder === "number" ? o.routingOrder : 1;
    if (!email || !displayName) continue;
    participants.push({
      email,
      displayName,
      signerRole,
      routingOrder,
      userId: typeof o.userId === "string" ? o.userId : null,
      requiresOtp: o.requiresOtp === true,
    });
  }

  if (!participants.length) {
    return Response.json({ error: "participants[] with email, displayName required" }, { status: 400 });
  }

  const { ipAddress, userAgent } = getRequestClientMeta(request);

  try {
    const envelopeId = await createSignatureEnvelope({
      dealId,
      createdByUserId: auth.userId,
      role: auth.role,
      sourceDocumentId,
      sourceDocumentKind: sourceDocumentKind as SourceDocumentKind,
      title,
      participants,
    });
    return Response.json({
      id: envelopeId,
      disclaimers: {
        notary: ESIGNATURE_NOTARY_DISCLAIMER,
        evidence: ESIGNATURE_EVIDENCE_DISCLAIMER,
        brokerApproval: ESIGNATURE_BROKER_APPROVAL_LINE,
      },
      audit: { ipAddress, userAgent },
    });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
