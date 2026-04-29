import "server-only";

import { NextRequest, NextResponse } from "next/server";

/** Placeholder until CRM/manager chat pipeline is wired. */
export async function handleLecipmManagerChat(
  _req: NextRequest,
  _body: Record<string, unknown>,
): Promise<Response> {
  return NextResponse.json({
    ok: true,
    reply: "Assistant is offline in this build — try again after chat services are enabled.",
  });
}
