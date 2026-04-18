import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { aiAutopilotV1Flags } from "@/config/feature-flags";
import { listActionsForViewer, type AutopilotActionSort } from "@/modules/ai-autopilot";

export const dynamic = "force-dynamic";

function parseSort(sp: URLSearchParams): AutopilotActionSort | undefined {
  const s = sp.get("sort");
  if (s === "quality" || s === "urgency" || s === "newest" || s === "domain") return s;
  return undefined;
}

/** GET /api/autopilot/actions — scoped queue; sort=quality|urgency|newest|domain (default newest). */
export async function GET(req: NextRequest) {
  if (!aiAutopilotV1Flags.aiAutopilotV1) {
    return NextResponse.json({ error: "AI Autopilot v1 is disabled" }, { status: 403 });
  }
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const sort = parseSort(req.nextUrl.searchParams);
  const actions = await listActionsForViewer({ viewerId: userId, role: user.role, sort });
  return NextResponse.json({ actions, sort: sort ?? "newest" });
}
