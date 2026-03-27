import { NextResponse } from "next/server";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { requireDocumentAccess } from "@/app/api/legal-workflow/_auth";
import { createAuditLog, createSignatureReadiness, getDocumentById } from "@/src/modules/legal-workflow/infrastructure/legalWorkflowRepository";
import { updateDocumentStatus } from "@/src/modules/legal-workflow/application/updateDocumentStatus";
import { assertNegotiationSignatureAllowed } from "@/src/modules/negotiation-chain-engine/application/negotiationSignatureGuard";

export async function POST(req: Request, context: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await context.params;
  const auth = await requireDocumentAccess(documentId);
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const signerName = String(body.signerName ?? "").trim();
  const signerEmail = String(body.signerEmail ?? "").trim();
  if (!signerName || !signerEmail) return NextResponse.json({ error: "signerName and signerEmail required" }, { status: 400 });

  const neg = await assertNegotiationSignatureAllowed(documentId);
  if (!neg.ok) return NextResponse.json({ error: neg.message }, { status: neg.status });

  const sig = await createSignatureReadiness({
    documentId,
    signerName,
    signerEmail,
    negotiationVersionId: neg.negotiationVersionId,
  });
  await createAuditLog({
    documentId,
    actorUserId: auth.userId!,
    actionType: "signed",
    metadata: {
      signerName,
      signerEmail,
      negotiationVersionId: neg.negotiationVersionId ?? undefined,
    },
  });
  captureServerEvent(auth.userId!, "legal_document_signature_intent_recorded", {
    documentId,
    signatureId: sig.id,
    negotiationVersionId: neg.negotiationVersionId ?? null,
  });

  const doc = await getDocumentById(documentId);
  if (doc && (doc.status === "finalized" || doc.status === "exported")) {
    await updateDocumentStatus({ documentId, actorUserId: auth.userId!, nextStatus: "signed", metadata: { signerEmail } });
  }

  return NextResponse.json({ signature: sig });
}
