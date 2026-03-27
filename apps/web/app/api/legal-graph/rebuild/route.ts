import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { buildLegalGraph } from "@/src/modules/legal-intelligence-graph/application/buildLegalGraph";

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "sign in required" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const documentId = String(body.documentId ?? "");
  if (!documentId) return NextResponse.json({ error: "documentId required" }, { status: 400 });
  const out = await buildLegalGraph({ documentId, actorUserId: userId });
  return NextResponse.json({ rebuilt: out });
}
