import { NextResponse } from "next/server";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { requireAutoDraftingAccess } from "@/app/api/auto-drafting/_auth";
import { generateDraftFromFacts } from "@/src/modules/ai-auto-drafting/application/generateDraftFromFacts";
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

  const result = await generateDraftFromFacts({ templateId, sectionKey, documentType, facts });
  const { validation, ...out } = result;
  await recordAutoDraftingEvent({
    documentId,
    sectionKey,
    actionType: "generate",
    createdBy: auth.userId,
    inputPayload: { templateId, sectionKey, facts },
    output: out,
  });
  captureServerEvent(auth.userId, "auto_draft_generated", {
    documentId,
    sectionKey,
    templateId,
    contradictionHints: validation.contradictions.length,
  });
  return NextResponse.json(result);
}
