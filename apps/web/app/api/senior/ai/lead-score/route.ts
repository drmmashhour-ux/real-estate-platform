import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { scoreLeadWithAiLayer } from "@/modules/senior-living/ai/senior-lead-scoring.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { leadId?: string };
  try {
    body = (await req.json()) as { leadId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const leadId = typeof body.leadId === "string" ? body.leadId.trim() : "";
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });

  try {
    const out = await scoreLeadWithAiLayer(leadId);
    return NextResponse.json({
      leadId,
      score: out.score,
      band: out.band,
      reasons: out.bullets,
    });
  } catch (e) {
    logError("[api.senior.ai.lead-score]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
