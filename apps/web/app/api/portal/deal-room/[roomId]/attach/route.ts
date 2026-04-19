import { NextResponse } from "next/server";

import { portalAttachDocument } from "@/modules/deal-room/deal-room-portal.service";
import type { DealRoomDocumentKind } from "@/modules/deal-room/deal-room.types";

export const dynamic = "force-dynamic";

const KINDS = new Set<DealRoomDocumentKind>(["placeholder", "upload", "external_link"]);

export async function POST(req: Request, ctx: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const token = typeof body?.token === "string" ? body.token : "";
  const participantId = typeof body?.participantId === "string" ? body.participantId : "";
  const requirementId = typeof body?.requirementId === "string" ? body.requirementId : "";
  const title = typeof body?.title === "string" ? body.title : undefined;
  const kind = body?.kind as DealRoomDocumentKind | undefined;
  const url = typeof body?.url === "string" ? body.url : undefined;

  if (!token.trim() || !participantId.trim() || !requirementId.trim()) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (!kind || !KINDS.has(kind)) {
    return NextResponse.json({ error: "Invalid document kind" }, { status: 400 });
  }

  const res = portalAttachDocument({
    roomId,
    token,
    participantId,
    requirementId,
    title,
    kind,
    url,
  });

  if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.error === "Unauthorized." ? 401 : 403 });
  return NextResponse.json({ documentId: res.documentId });
}
