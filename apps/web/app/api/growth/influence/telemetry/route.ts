import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import {
  recordInfluenceConvertedToAction,
  recordInfluenceSuggestionsGenerated,
  recordInfluenceSuggestionsViewed,
} from "@/modules/growth/ai-autopilot-influence-monitoring.service";

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { event?: string; count?: number; suggestionId?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.event === "generated" && typeof body.count === "number") {
    recordInfluenceSuggestionsGenerated(body.count);
  } else if (body.event === "viewed" && typeof body.count === "number") {
    recordInfluenceSuggestionsViewed(body.count);
  } else if (body.event === "convert" && body.suggestionId) {
    recordInfluenceConvertedToAction(body.suggestionId);
  } else {
    return NextResponse.json({ error: "Unknown event" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
