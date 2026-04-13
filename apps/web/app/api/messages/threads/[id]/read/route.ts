import { NextRequest, NextResponse } from "next/server";
import { resolveThreadViewerFromRequest } from "@/lib/messages/api-context";
import { markLecipmBrokerThreadRead } from "@/lib/messages/mark-read";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Params) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const guestToken = searchParams.get("guestToken");

  const resolved = await resolveThreadViewerFromRequest(request, guestToken);
  if (!resolved.viewer) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const result = await markLecipmBrokerThreadRead(id, resolved.viewer);
  if (!result.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
