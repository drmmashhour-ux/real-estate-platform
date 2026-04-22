import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { explainResults } from "@/modules/senior-living/ai/senior-ai-orchestrator.service";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ profileId: string }> }) {
  const { profileId } = await ctx.params;
  if (!profileId?.trim()) return NextResponse.json({ error: "profileId required" }, { status: 400 });

  try {
    const out = await explainResults(profileId, []);
    return NextResponse.json({
      profileId,
      summary: out.summary,
      why: "We keep your details private and only use them to suggest a short list.",
    });
  } catch (e) {
    logError("[api.senior.ai.explain]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
