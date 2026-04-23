import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { getRecommendation } from "@/modules/call-assistant/call-recommendation.service";
import type { CallAssistantContext } from "@/modules/call-assistant/call-assistant.types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: Partial<CallAssistantContext>;
  try {
    body = (await req.json()) as Partial<CallAssistantContext>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const audience = body.audience;
  const scriptCategory = body.scriptCategory;
  const stage = body.stage;

  if (audience !== "BROKER" && audience !== "INVESTOR") {
    return NextResponse.json({ error: "invalid_audience" }, { status: 400 });
  }
  if (!scriptCategory?.trim()) {
    return NextResponse.json({ error: "script_category_required" }, { status: 400 });
  }
  if (!stage) {
    return NextResponse.json({ error: "stage_required" }, { status: 400 });
  }

  try {
    const scriptContext = {
      audience,
      ...body.scriptContext,
    } as CallAssistantContext["scriptContext"];

    const ctx: CallAssistantContext = {
      audience,
      scriptCategory: scriptCategory as CallAssistantContext["scriptCategory"],
      stage,
      discoveryIndex: typeof body.discoveryIndex === "number" ? body.discoveryIndex : undefined,
      lastProspectInput: typeof body.lastProspectInput === "string" ? body.lastProspectInput : undefined,
      scriptContext,
    };
    const result = getRecommendation(ctx);
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "next_line_failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
