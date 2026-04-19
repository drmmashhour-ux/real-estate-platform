import { NextResponse } from "next/server";

import { portalAddLimitedNote } from "@/modules/deal-room/deal-room-portal.service";

export const dynamic = "force-dynamic";

const noStore = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
} as const;

export async function POST(req: Request, ctx: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const token = typeof body?.token === "string" ? body.token : "";
  const participantId = typeof body?.participantId === "string" ? body.participantId : "";
  const noteBody = typeof body?.body === "string" ? body.body : "";

  if (!token.trim() || !participantId.trim()) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400, headers: noStore });
  }

  const res = portalAddLimitedNote({
    roomId,
    token,
    participantId,
    body: noteBody,
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: res.error },
      { status: res.error === "Unauthorized." ? 401 : 403, headers: noStore }
    );
  }
  return NextResponse.json({ ok: true }, { headers: noStore });
}
