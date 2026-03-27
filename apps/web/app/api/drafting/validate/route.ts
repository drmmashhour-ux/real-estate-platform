import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/app/api/internal/model-tuning/_auth";
import { validateDraft } from "@/src/modules/ai-drafting/validation/draftValidationService";

export async function POST(req: Request) {
  const auth = await requirePlatformAdmin();
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const templateId = String(body.templateId ?? "");
  const values = (body.values ?? {}) as Record<string, string>;
  return NextResponse.json(validateDraft(templateId, values));
}
