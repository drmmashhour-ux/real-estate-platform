import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { getLiveAssist } from "@/modules/call-center/call-live.service";
import type { LiveAssistInput } from "@/modules/call-center/call-center.types";
import type { ScriptContext } from "@/modules/sales-scripts/sales-script.types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: Partial<LiveAssistInput> & { scriptContext?: ScriptContext };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const audience = body.audience;
  const scriptCategory = body.scriptCategory;
  const stage = body.stage;
  const lastClientSentence = typeof body.lastClientSentence === "string" ? body.lastClientSentence : "";
  const transcript = typeof body.transcript === "string" ? body.transcript : "";

  if (audience !== "BROKER" && audience !== "INVESTOR") {
    return NextResponse.json({ error: "invalid_audience" }, { status: 400 });
  }
  if (!scriptCategory?.trim() || !stage) {
    return NextResponse.json({ error: "invalid_context" }, { status: 400 });
  }

  try {
    const input: LiveAssistInput = {
      transcript,
      lastClientSentence,
      audience,
      scriptCategory: scriptCategory as LiveAssistInput["scriptCategory"],
      stage,
      discoveryIndex: typeof body.discoveryIndex === "number" ? body.discoveryIndex : undefined,
    };
    const result = getLiveAssist(input, body.scriptContext ? { audience, ...body.scriptContext } : undefined);
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "suggest_failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
