import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/app/api/internal/model-tuning/_auth";
import { listDraftTemplates } from "@/src/modules/ai-drafting/templates/templateEngine";

export async function GET() {
  const auth = await requirePlatformAdmin();
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });
  return NextResponse.json({ templates: listDraftTemplates() });
}
