import { NextResponse } from "next/server";
import { DeclarationActionType } from "@/src/modules/seller-declaration-ai/domain/declaration.enums";
import { createDeclarationAiEvent } from "@/src/modules/seller-declaration-ai/infrastructure/declarationRepository";
import { generateSectionSuggestion } from "@/src/modules/seller-declaration-ai/application/generateSectionSuggestion";
import { requireSellerOrAdminForListing } from "@/app/api/seller-declaration-ai/_auth";
import { captureServerEvent } from "@/lib/analytics/posthog-server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const listingId = String(body.listingId ?? "");
  const draftId = String(body.draftId ?? "");
  const sectionKey = String(body.sectionKey ?? "");
  const currentFacts = (body.currentFacts ?? {}) as Record<string, unknown>;
  const markApplied = body.markApplied === true;

  if (!listingId || !draftId || !sectionKey) return NextResponse.json({ error: "listingId, draftId, sectionKey required" }, { status: 400 });
  const auth = await requireSellerOrAdminForListing(listingId);
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

  if (markApplied) {
    await createDeclarationAiEvent({
      draftId,
      sectionKey,
      actionType: DeclarationActionType.SUGGESTION_APPLIED,
      promptContext: { listingId },
      output: { applied: true },
    });
    captureServerEvent(auth.userId!, "declaration_ai_suggestion_applied", { draftId, sectionKey });
    return NextResponse.json({ ok: true });
  }

  const result = await generateSectionSuggestion({ sectionKey, currentFacts, listingId, draftId, actorUserId: auth.userId! });
  return NextResponse.json(result);
}
