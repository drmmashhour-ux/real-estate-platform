import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { generateBetterHook, type HookAngle } from "@/src/modules/daily-execution/domain/outreachCopy";

export const dynamic = "force-dynamic";

/** POST { angle?: "mistake" | "loss" | "curiosity" } — three hook ideas (you record manually). */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { angle?: string };
  const a = body.angle;
  const angle: HookAngle =
    a === "mistake" || a === "loss" || a === "curiosity" ? a : "curiosity";

  const result = generateBetterHook(angle);
  return NextResponse.json(result);
}
