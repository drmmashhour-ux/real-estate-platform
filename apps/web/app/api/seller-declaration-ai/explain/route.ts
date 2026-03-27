import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { explainDeclarationSection } from "@/src/modules/seller-declaration-ai/infrastructure/declarationExplanationService";

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "sign in required" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const sectionKey = String(body.sectionKey ?? "");
  if (!sectionKey) return NextResponse.json({ error: "sectionKey required" }, { status: 400 });
  captureServerEvent(userId, "declaration_ai_suggestion_requested", { sectionKey, mode: "explain" });
  return NextResponse.json(await explainDeclarationSection(sectionKey));
}
