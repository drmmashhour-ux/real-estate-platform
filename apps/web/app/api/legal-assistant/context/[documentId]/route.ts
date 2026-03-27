import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { buildLegalAssistantContext } from "@/src/modules/ai-legal-assistant/application/buildLegalAssistantContext";

export async function GET(_req: Request, context: { params: Promise<{ documentId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "sign in required" }, { status: 401 });
  const { documentId } = await context.params;
  const ctx = await buildLegalAssistantContext(documentId, userId);
  return NextResponse.json({ context: ctx });
}
