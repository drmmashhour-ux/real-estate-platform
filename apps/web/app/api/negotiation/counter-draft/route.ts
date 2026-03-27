import { NextResponse } from "next/server";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { assertNegotiationDraftAccess } from "@/app/api/negotiation/_access";
import { generateCounterProposalDraft } from "@/src/modules/ai-negotiation-deal-intelligence/application/generateCounterProposalDraft";
import type { NegotiationPlanSnapshot } from "@/src/modules/ai-negotiation-deal-intelligence/domain/negotiationDraft.types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const propertyId = String(body.propertyId ?? body.listingId ?? "");
  const documentId = body.documentId != null ? String(body.documentId) : undefined;
  const negotiationPlan = (body.negotiationPlan ?? null) as NegotiationPlanSnapshot | null;
  const desiredChanges = Array.isArray(body.desiredChanges) ? (body.desiredChanges as unknown[]).filter((x) => typeof x === "string") as string[] : undefined;
  const userContext =
    body.userContext && typeof body.userContext === "object"
      ? (body.userContext as { role?: string; strategyMode?: string })
      : undefined;

  if (!propertyId) return NextResponse.json({ error: "propertyId or listingId required" }, { status: 400 });

  const auth = await assertNegotiationDraftAccess({ listingId: propertyId, documentId: documentId || null });
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const draft = await generateCounterProposalDraft({
    propertyId,
    documentId,
    negotiationPlan,
    desiredChanges,
    userContext,
  });
  if (!draft) return NextResponse.json({ error: "Not found" }, { status: 404 });

  captureServerEvent(auth.userId, "counter_proposal_draft_generated", {
    listingId: propertyId,
    documentId: documentId ?? null,
    confidence: draft.confidence,
    sourceRefCount: draft.sourceRefs.length,
  });
  if (draft.protections.length > 0) {
    captureServerEvent(auth.userId, "recommended_protection_applied", {
      listingId: propertyId,
      source: "counter_proposal_draft",
      count: draft.protections.length,
    });
  }

  return NextResponse.json({ draft, dispatch: "none" as const });
}
