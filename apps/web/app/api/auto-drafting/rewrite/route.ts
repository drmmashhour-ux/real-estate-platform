import { NextResponse } from "next/server";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { requireAutoDraftingAccess } from "@/app/api/auto-drafting/_auth";
import { rewriteDraftNotes } from "@/src/modules/ai-auto-drafting/application/rewriteDraftNotes";
import { recordAutoDraftingEvent } from "@/src/modules/ai-auto-drafting/infrastructure/autoDraftingRepository";
import { AutoDraftDocumentType } from "@/src/modules/ai-auto-drafting/domain/autoDrafting.enums";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const documentId = String(body.documentId ?? "");
  const auth = await requireAutoDraftingAccess(documentId);
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

  const rawNotes = String(body.rawNotes ?? "");
  const sectionKey = String(body.sectionKey ?? "");
  const documentType = (body.documentType ?? AutoDraftDocumentType.SELLER_DECLARATION) as (typeof AutoDraftDocumentType)[keyof typeof AutoDraftDocumentType];

  const out = await rewriteDraftNotes({ documentType, sectionKey, rawNotes });
  await recordAutoDraftingEvent({
    documentId,
    sectionKey,
    actionType: "rewrite_notes",
    createdBy: auth.userId,
    inputPayload: { rawNotes },
    output: out,
  });
  captureServerEvent(auth.userId, "auto_draft_generated", { documentId, mode: "rewrite_notes" });
  return NextResponse.json(out);
}
