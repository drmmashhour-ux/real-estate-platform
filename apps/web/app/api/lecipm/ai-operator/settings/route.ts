import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getOrCreateSettings, updateAutonomyMode } from "@/src/modules/ai-operator/infrastructure/aiOperatorRepository";
import { AI_OPERATOR_AUTONOMY_MODES } from "@/src/modules/ai-operator/domain/operator.enums";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const s = await getOrCreateSettings(userId);
  return NextResponse.json({ autonomyMode: s.autonomyMode, allowedModes: AI_OPERATOR_AUTONOMY_MODES });
}

export async function PATCH(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const mode = typeof body?.autonomyMode === "string" ? body.autonomyMode : null;
  if (!mode) return NextResponse.json({ error: "autonomyMode required" }, { status: 400 });
  const s = await updateAutonomyMode(userId, mode);
  return NextResponse.json({ autonomyMode: s.autonomyMode });
}
