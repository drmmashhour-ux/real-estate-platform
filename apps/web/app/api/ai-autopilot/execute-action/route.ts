import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { prisma } from "@/lib/db";
import { executeAutopilotAction } from "@/modules/ai-autopilot-layer/autopilotExecutor";
import type { AutopilotLayerMode, AutopilotPlanContext } from "@/modules/ai-autopilot-layer/types";

export const dynamic = "force-dynamic";

function asMode(m: string): AutopilotLayerMode {
  const u = m.toUpperCase();
  if (u === "OFF" || u === "ASSIST" || u === "SAFE_AUTOPILOT" || u === "FULL_AUTOPILOT_APPROVAL") return u;
  return "ASSIST";
}

export async function POST(req: Request) {
  const { userId } = await requireAuthenticatedUser();
  const body = (await req.json()) as { actionId?: string; context?: AutopilotPlanContext };
  if (!body.actionId) return NextResponse.json({ error: "actionId required" }, { status: 400 });

  const row = await prisma.aiAutopilotLayerAction.findFirst({
    where: { id: body.actionId, userId },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const mode = asMode(row.mode);
  const ctx: AutopilotPlanContext = {
    userId,
    draftId: row.draftId ?? undefined,
    dealId: row.dealId ?? undefined,
    role: "BROKER",
    ...body.context,
    userId,
  };

  const result = await executeAutopilotAction(body.actionId, ctx, mode);
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
