import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { runLegalAssistant } from "@/src/modules/ai-legal-assistant/application/runLegalAssistant";

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "sign in required" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const documentId = String(body.documentId ?? "");
  const message = String(body.message ?? "");
  if (!documentId || !message) return NextResponse.json({ error: "documentId and message required" }, { status: 400 });

  const answer = await runLegalAssistant({
    documentId,
    userId,
    message,
    sectionKey: body.sectionKey ? String(body.sectionKey) : undefined,
    versionA: body.versionA ? Number(body.versionA) : undefined,
    versionB: body.versionB ? Number(body.versionB) : undefined,
  });

  return NextResponse.json({ answer });
}
