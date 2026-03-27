import { NextResponse } from "next/server";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { requireAutoDraftingAccess } from "@/app/api/auto-drafting/_auth";
import { generateDraftFollowUpQuestions } from "@/src/modules/ai-auto-drafting/application/generateDraftFollowUpQuestions";
import { recordAutoDraftingEvent } from "@/src/modules/ai-auto-drafting/infrastructure/autoDraftingRepository";
import { AutoDraftDocumentType } from "@/src/modules/ai-auto-drafting/domain/autoDrafting.enums";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const documentId = String(body.documentId ?? "");
  const auth = await requireAutoDraftingAccess(documentId);
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

  const templateId = String(body.templateId ?? "seller_declaration_v1");
  const sectionKey = String(body.sectionKey ?? "");
  const facts = (body.facts ?? {}) as Record<string, unknown>;
  const documentType = (body.documentType ?? AutoDraftDocumentType.SELLER_DECLARATION) as (typeof AutoDraftDocumentType)[keyof typeof AutoDraftDocumentType];

  const out = generateDraftFollowUpQuestions({ templateId, sectionKey, documentType, facts });
  await recordAutoDraftingEvent({
    documentId,
    sectionKey,
    actionType: "follow_up",
    createdBy: auth.userId,
    inputPayload: { templateId, sectionKey, facts },
    output: out,
  });
  captureServerEvent(auth.userId, "auto_draft_generated", { documentId, mode: "follow_up" });
  return NextResponse.json(out);
}
