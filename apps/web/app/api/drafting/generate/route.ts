import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/app/api/internal/model-tuning/_auth";
import { getDraftTemplateById, generateDraftDocument } from "@/src/modules/ai-drafting/templates/templateEngine";
import { validateDraft } from "@/src/modules/ai-drafting/validation/draftValidationService";

export async function POST(req: Request) {
  const auth = await requirePlatformAdmin();
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const templateId = String(body.templateId ?? "");
  const values = (body.values ?? {}) as Record<string, string>;

  const template = getDraftTemplateById(templateId);
  if (!template) return NextResponse.json({ error: "template_not_found" }, { status: 404 });

  const validation = validateDraft(templateId, values);
  const document = generateDraftDocument(template, values);

  return NextResponse.json({ document, validation, template: { id: template.id, name: template.name } });
}
