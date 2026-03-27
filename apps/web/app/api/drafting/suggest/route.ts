import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/app/api/internal/model-tuning/_auth";
import { explainClause, improveWording, suggestFieldText } from "@/src/modules/ai-drafting/assistant/draftingAssistant";

export async function POST(req: Request) {
  const auth = await requirePlatformAdmin();
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const mode = String(body.mode ?? "field");

  if (mode === "explain") {
    const out = await explainClause(String(body.clauseText ?? ""));
    return NextResponse.json(out);
  }
  if (mode === "improve") {
    const out = improveWording(String(body.text ?? ""));
    return NextResponse.json(out);
  }

  const out = await suggestFieldText({
    templateId: String(body.templateId ?? ""),
    fieldKey: String(body.fieldKey ?? ""),
    context: (body.context ?? {}) as Record<string, string>,
  });
  return NextResponse.json(out);
}
