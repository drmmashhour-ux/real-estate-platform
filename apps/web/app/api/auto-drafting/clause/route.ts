import { NextResponse } from "next/server";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { requireAutoDraftingAccess } from "@/app/api/auto-drafting/_auth";
import { generateClauseDraft } from "@/src/modules/ai-auto-drafting/application/generateClauseDraft";
import { recordAutoDraftingEvent } from "@/src/modules/ai-auto-drafting/infrastructure/autoDraftingRepository";
import { AutoDraftDocumentType } from "@/src/modules/ai-auto-drafting/domain/autoDrafting.enums";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const documentId = String(body.documentId ?? "");
  const auth = await requireAutoDraftingAccess(documentId);
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

  const topic = String(body.topic ?? "general");
  const sectionKey = String(body.sectionKey ?? "clause");
  const facts = (body.facts ?? {}) as Record<string, unknown>;
  const documentType = (body.documentType ?? AutoDraftDocumentType.BROKERAGE_FORM) as (typeof AutoDraftDocumentType)[keyof typeof AutoDraftDocumentType];

  const out = await generateClauseDraft({ documentType, sectionKey, topic, facts });
  await recordAutoDraftingEvent({
    documentId,
    sectionKey,
    actionType: "clause",
    createdBy: auth.userId,
    inputPayload: { topic, facts },
    output: out,
  });
  captureServerEvent(auth.userId, "auto_draft_generated", { documentId, mode: "clause" });
  return NextResponse.json(out);
}
