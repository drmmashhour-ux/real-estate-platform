import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { aiAutopilotV1Flags } from "@/config/feature-flags";
import { guardedExecute } from "@/modules/ai-autopilot";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!aiAutopilotV1Flags.aiAutopilotV1) {
    return NextResponse.json({ error: "AI Autopilot v1 is disabled" }, { status: 403 });
  }
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const { id } = await ctx.params;
  const result = await guardedExecute({ actionId: id, actorUserId: userId, role: user.role });
  if (!result.ok) {
    const st =
      result.reason === "forbidden" ? 403 : result.reason === "not_found" ? 404 : result.reason === "disabled" ? 403 : 400;
    return NextResponse.json({ error: result.reason ?? "execute_failed" }, { status: st });
  }
  return NextResponse.json({ ok: true });
}
