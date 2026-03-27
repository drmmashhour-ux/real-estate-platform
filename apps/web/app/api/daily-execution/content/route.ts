import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { generateShortVideoScript } from "@/src/modules/growth-automation/application/generateShortVideoScript";

export const dynamic = "force-dynamic";

/**
 * POST { topic? } — suggests hook + beats (viral / growth engine when LLM configured; safe fallback always).
 * User copies and publishes manually.
 */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { topic?: string };
  const topic = typeof body.topic === "string" && body.topic.trim() ? body.topic.trim().slice(0, 200) : "Daily LECIPM tip";

  const script = await generateShortVideoScript({
    topic,
    contentFamily: "product_demo",
    productOrFeature: "LECIPM broker workspace",
  });

  const shortScript = [script.hook, ...script.beats, script.cta].filter(Boolean).join("\n\n");

  return NextResponse.json({
    hook: script.hook,
    beats: script.beats,
    onScreenText: script.onScreenText,
    cta: script.cta,
    shortScript,
    durationSecondsEstimate: script.durationSecondsEstimate,
  });
}
