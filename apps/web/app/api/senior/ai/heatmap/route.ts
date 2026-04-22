import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { computeAreaInsights } from "@/modules/senior-living/ai/senior-ai-orchestrator.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city")?.trim() ?? "";
  if (!city) return NextResponse.json({ error: "city required" }, { status: 400 });

  try {
    await computeAreaInsights(city);
    return NextResponse.json({ ok: true, city });
  } catch (e) {
    logError("[api.senior.ai.heatmap]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
