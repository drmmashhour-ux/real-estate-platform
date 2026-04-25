import { NextRequest } from "next/server";

import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { getAiSalesAgentConfig } from "@/modules/ai-sales-agent/ai-sales-config.service";
import { getAiSalesAgentMetrics } from "@/modules/ai-sales-agent/ai-sales-learning.service";
import { updateFollowUpSettings } from "@/lib/ai/follow-up/settings";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const userId = await getGuestId();
  if (!userId) return null;
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (u?.role !== "ADMIN") return null;
  return userId;
}

/** GET — metrics + effective mode (read-only config surface). PATCH — templatesJson.aiSalesAgent.mode etc. */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Admin only" }, { status: 403 });

  const [metrics, cfg] = await Promise.all([getAiSalesAgentMetrics(), getAiSalesAgentConfig()]);

  return Response.json({
    metrics,
    config: cfg,
    env: {
      featureFlag: process.env.FEATURE_AI_SALES_AGENT_V1 === "true" || process.env.FEATURE_AI_SALES_AGENT_V1 === "1",
    },
  });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Admin only" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const row = await prisma.aiFollowUpSettings.findUnique({ where: { id: "global" } });
  const tj = (row?.templatesJson as Record<string, unknown> | null) ?? {};
  const aiPrev = (tj.aiSalesAgent as Record<string, unknown> | undefined) ?? {};

  const nextAi = {
    ...aiPrev,
    ...(typeof body.mode === "string" ? { mode: body.mode } : {}),
    ...(typeof body.ownSequence === "boolean" ? { ownSequence: body.ownSequence } : {}),
  };

  await updateFollowUpSettings({
    templatesJson: {
      ...tj,
      aiSalesAgent: nextAi,
    },
  });

  const cfg = await getAiSalesAgentConfig();
  return Response.json({ ok: true, config: cfg });
}
