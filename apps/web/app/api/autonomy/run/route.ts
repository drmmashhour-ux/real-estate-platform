import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { runAutonomousOperations } from "@/modules/autonomy/autonomy.engine";

export const dynamic = "force-dynamic";

async function canUse(userId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return u?.role === PlatformRole.ADMIN || u?.role === PlatformRole.BROKER;
}

/** POST — run autonomy pipeline (candidates → route → execute safe internals). */
export async function POST(req: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    const allowed = await canUse(userId);
    if (!allowed) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const dryRun = Boolean(body.dryRun);
    const brokerId = typeof body.brokerId === "string" ? body.brokerId : userId;

    const summary = await runAutonomousOperations({
      brokerId,
      dryRun,
      portfolioHints: Array.isArray(body.portfolioHints) ? (body.portfolioHints as Record<string, unknown>[]) : [],
      crmInsights: Array.isArray(body.crmInsights) ? (body.crmInsights as Record<string, unknown>[]) : [],
      orchestrationHints: Array.isArray(body.orchestrationHints)
        ? (body.orchestrationHints as Record<string, unknown>[])
        : [],
      listingIntelligence: Array.isArray(body.listingIntelligence)
        ? (body.listingIntelligence as Record<string, unknown>[])
        : [],
      negotiationHints: Array.isArray(body.negotiationHints)
        ? (body.negotiationHints as Record<string, unknown>[])
        : [],
      playbookOutputs: Array.isArray(body.playbookOutputs) ? (body.playbookOutputs as Record<string, unknown>[]) : [],
      sourceAgent: typeof body.sourceAgent === "string" ? body.sourceAgent : undefined,
      sourceStrategyKey: typeof body.sourceStrategyKey === "string" ? body.sourceStrategyKey : undefined,
      sourceAssignmentId: typeof body.sourceAssignmentId === "string" ? body.sourceAssignmentId : undefined,
      sourceOrchestrationRunId:
        typeof body.sourceOrchestrationRunId === "string" ? body.sourceOrchestrationRunId : undefined,
    });

    return NextResponse.json({ ok: true, summary });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "run_failed" },
      { status: 200 }
    );
  }
}
