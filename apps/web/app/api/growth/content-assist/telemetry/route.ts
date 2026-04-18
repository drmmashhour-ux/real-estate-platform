import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import {
  recordContentDraftCopied,
  recordContentDraftRegenerated,
  recordContentDraftsGenerated,
} from "@/modules/growth/ai-autopilot-content-monitoring.service";

/**
 * Dashboard-only telemetry for content draft assist (copy / regenerate / batch viewed). No publishing.
 */
export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { event?: string; draftId?: string; type?: string; count?: number };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.event === "copy" && body.draftId && body.type) {
    recordContentDraftCopied(body.draftId, body.type);
  } else if (body.event === "regenerate") {
    recordContentDraftRegenerated();
  } else if (body.event === "batch" && typeof body.count === "number" && body.count >= 0) {
    recordContentDraftsGenerated(body.count);
  } else {
    return NextResponse.json({ error: "Unknown event" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
