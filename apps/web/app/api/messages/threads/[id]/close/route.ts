import { NextRequest, NextResponse } from "next/server";
import { resolveThreadViewerFromRequest } from "@/lib/messages/api-context";
import { closeLecipmBrokerThread } from "@/lib/messages/close-thread";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Params) {
  const { id } = await context.params;
  const resolved = await resolveThreadViewerFromRequest(request, null);
  if (!resolved.viewer) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const result = await closeLecipmBrokerThread(id, resolved.viewer);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Forbidden" },
      { status: result.error === "Not found" ? 404 : 403 }
    );
  }

  return NextResponse.json({ ok: true });
}
