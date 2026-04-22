import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { updateLearning } from "@/modules/senior-living/ai/senior-ai-orchestrator.service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const cron = process.env.CRON_SECRET?.trim();
  const authHeader = req.headers.get("authorization") ?? "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (cron && bearer !== cron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const out = await updateLearning();
    return NextResponse.json(out);
  } catch (e) {
    logError("[api.senior.ai.learn]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
