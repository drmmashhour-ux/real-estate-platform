import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { learningStats } from "@/src/modules/ai-operator/infrastructure/aiOperatorRepository";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const byStatus = await learningStats(userId);
  return NextResponse.json({
    byStatus,
    learningNote: "Tune prompts from approved vs rejected ratios; no model weights updated server-side in this build.",
  });
}
