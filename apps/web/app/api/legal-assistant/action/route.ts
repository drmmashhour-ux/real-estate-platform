import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { executeLegalAssistantAction } from "@/src/modules/ai-legal-assistant/application/executeLegalAssistantAction";

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "sign in required" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const documentId = String(body.documentId ?? "");
  const action = String(body.action ?? "");
  if (!documentId || !action) return NextResponse.json({ error: "documentId and action required" }, { status: 400 });

  const out = await executeLegalAssistantAction({
    action: action as any,
    documentId,
    sectionKey: body.sectionKey ? String(body.sectionKey) : undefined,
    userId,
  });
  return NextResponse.json({ action: out });
}
