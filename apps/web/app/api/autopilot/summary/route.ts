import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { aiAutopilotV1Flags } from "@/config/feature-flags";
import { getSummary } from "@/modules/ai-autopilot";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!aiAutopilotV1Flags.aiAutopilotV1) {
    return NextResponse.json({ error: "AI Autopilot v1 is disabled" }, { status: 403 });
  }
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const summary = await getSummary({ viewerId: userId, role: user.role });
  return NextResponse.json(summary);
}
