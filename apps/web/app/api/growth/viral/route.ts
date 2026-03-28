import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { trackViralEvent } from "@/src/services/viralTracking";

export const dynamic = "force-dynamic";

/** POST /api/growth/viral — track shares / invite clicks (authenticated). */
export async function POST(req: NextRequest) {
  const userId = await getGuestId();
  let body: { kind?: string; metadata?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const kind = body.kind;
  if (kind !== "share" && kind !== "invite_sent") {
    return Response.json({ error: "Invalid kind" }, { status: 400 });
  }
  await trackViralEvent(kind, body.metadata ?? {}, userId ?? undefined);
  return Response.json({ ok: true });
}
