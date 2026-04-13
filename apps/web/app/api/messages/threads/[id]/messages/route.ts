import { NextRequest, NextResponse } from "next/server";
import { resolveThreadViewerFromRequest } from "@/lib/messages/api-context";
import { sendLecipmBrokerMessage } from "@/lib/messages/send-message";

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

  let body: { body?: unknown };
  try {
    body = (await request.json()) as { body?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = await sendLecipmBrokerMessage({
    threadId: id,
    body: body.body as unknown,
    viewer: resolved.viewer,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ messageId: result.messageId });
}
