import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { getOrCreateAutopilotLayerConfig } from "@/modules/ai-autopilot-layer/autopilotConfig";
import { planAutopilotActions } from "@/modules/ai-autopilot-layer/autopilotPlanner";
import type { AutopilotLayerMode, AutopilotPlanContext } from "@/modules/ai-autopilot-layer/types";
import { logAutopilotEvent } from "@/modules/ai-autopilot-layer/autopilotAuditLogger";
import { guardExecutionContext } from "@/modules/ai-autopilot-layer/autopilotGuards";

export const dynamic = "force-dynamic";

function asMode(m: string): AutopilotLayerMode {
  const u = m.toUpperCase();
  if (u === "OFF" || u === "ASSIST" || u === "SAFE_AUTOPILOT" || u === "FULL_AUTOPILOT_APPROVAL") return u;
  return "ASSIST";
}

export async function POST(req: Request) {
  const { userId } = await requireAuthenticatedUser();
  const body = (await req.json().catch(() => ({}))) as {
    context?: AutopilotPlanContext;
    persist?: boolean;
  };

  const cfg = await getOrCreateAutopilotLayerConfig(userId);
  if (cfg.paused) {
    return NextResponse.json({ planned: [], message: "Autopilot paused", userId });
  }

  const mode = asMode(cfg.mode);
  const ctx: AutopilotPlanContext = {
    userId,
    ...body.context,
    userId,
  };

  const planned = planAutopilotActions(mode, ctx);
  await logAutopilotEvent({
    userId,
    eventKey: "autopilot_plan_generated",
    payload: { count: planned.length, mode, draftId: ctx.draftId ?? null },
  });

  if (body.persist === false) {
    return NextResponse.json({ planned, userId, mode });
  }

  const created = [];
  for (const p of planned) {
    const g = guardExecutionContext(p.actionKey, mode, ctx);
    const status = g.ok ? "PROPOSED" : "BLOCKED";
    const row = await prisma.aiAutopilotLayerAction.create({
      data: {
        userId,
        draftId: ctx.draftId ?? undefined,
        dealId: ctx.dealId ?? undefined,
        actionKey: p.actionKey,
        actionType: p.actionType,
        mode,
        status,
        riskLevel: p.riskLevel,
        payloadJson: (p.payloadJson ?? {}) as object,
        reasonFr: p.reasonFr,
        requiresApproval: p.requiresApproval,
        blockReason: g.ok ? null : g.reason,
      },
    });
    created.push(row);
    await logAutopilotEvent({
      userId,
      actionId: row.id,
      eventKey: g.ok ? "autopilot_action_proposed" : "autopilot_action_blocked",
      payload: g.ok ? { actionKey: p.actionKey } : { reason: g.reason },
    });
  }

  return NextResponse.json({ planned, persisted: created, userId, mode });
}
