import { NextRequest, NextResponse } from "next/server";
import { resolveThreadViewerFromRequest } from "@/lib/messages/api-context";
import { getLecipmBrokerThreadDetail } from "@/lib/messages/get-thread";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Params) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const guestToken = searchParams.get("guestToken");

  const resolved = await resolveThreadViewerFromRequest(request, guestToken);
  if (!resolved.viewer) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const detail = await getLecipmBrokerThreadDetail(id, resolved.viewer);
  if (!detail) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(detail);
}
