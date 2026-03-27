import { NextResponse } from "next/server";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { assertNegotiationDraftAccess } from "@/app/api/negotiation/_access";
import { generateNegotiationMessageDraft } from "@/src/modules/ai-negotiation-deal-intelligence/application/generateNegotiationMessageDraft";
import type {
  NegotiationMessageDraftType,
  NegotiationPlanSnapshot,
} from "@/src/modules/ai-negotiation-deal-intelligence/domain/negotiationDraft.types";

const KINDS: NegotiationMessageDraftType[] = [
  "seller_clarification_request",
  "buyer_guidance_note",
  "broker_internal_summary",
  "needs_more_documents_request",
  "inspection_recommended_message",
  "document_review_recommended_message",
];

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const propertyId = String(body.propertyId ?? body.listingId ?? "");
  const documentId = body.documentId != null ? String(body.documentId) : undefined;
  const draftType = String(body.draftType ?? body.kind ?? "") as NegotiationMessageDraftType;
  const negotiationPlan = (body.negotiationPlan ?? null) as NegotiationPlanSnapshot | null;
  const desiredChanges = Array.isArray(body.desiredChanges) ? (body.desiredChanges as unknown[]).filter((x) => typeof x === "string") as string[] : undefined;
  const userContext =
    body.userContext && typeof body.userContext === "object"
      ? (body.userContext as { role?: string; strategyMode?: string })
      : undefined;

  if (!propertyId) return NextResponse.json({ error: "propertyId or listingId required" }, { status: 400 });
  if (!KINDS.includes(draftType)) return NextResponse.json({ error: "invalid draftType" }, { status: 400 });

  const auth = await assertNegotiationDraftAccess({ listingId: propertyId, documentId: documentId || null });
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const draft = await generateNegotiationMessageDraft({
    propertyId,
    documentId,
    draftType,
    negotiationPlan,
    desiredChanges,
    userContext,
  });
  if (!draft) return NextResponse.json({ error: "Not found" }, { status: 404 });

  captureServerEvent(auth.userId, "negotiation_message_draft_generated", {
    listingId: propertyId,
    draftType,
    documentId: documentId ?? null,
    confidence: draft.confidence,
    sourceRefCount: draft.sourceRefs.length,
  });

  return NextResponse.json({ draft, dispatch: "none" as const });
}
