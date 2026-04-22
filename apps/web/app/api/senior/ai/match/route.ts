import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { generateMatches } from "@/modules/senior-living/ai/senior-ai-orchestrator.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { profileId?: string };
  try {
    body = (await req.json()) as { profileId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const profileId = typeof body.profileId === "string" ? body.profileId.trim() : "";
  if (!profileId) return NextResponse.json({ error: "profileId required" }, { status: 400 });

  try {
    const matches = await generateMatches(profileId);
    return NextResponse.json({
      profileId,
      matches: matches.map((m) => ({
        residenceId: m.residenceId,
        displayScore: m.displayScore,
        headline: m.explanation.headline,
        bullets: m.explanation.bullets,
      })),
    });
  } catch (e) {
    logError("[api.senior.ai.match]", { error: e });
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
