import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { aiAutopilotV1Flags } from "@/config/feature-flags";
import { persistRankedRun, runUnifiedDetection } from "@/modules/ai-autopilot";

export const dynamic = "force-dynamic";

/**
 * POST /api/autopilot/orchestrate/run — detect + optionally persist ranked actions.
 * Does not replace POST /api/autopilot/run (FSBO listing autopilot v2).
 */
export async function POST(req: Request) {
  if (!aiAutopilotV1Flags.aiAutopilotV1) {
    return NextResponse.json({ error: "AI Autopilot v1 is disabled" }, { status: 403 });
  }
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let persist = false;
  try {
    const j = (await req.json().catch(() => ({}))) as { persist?: boolean };
    persist = Boolean(j.persist);
  } catch {
    persist = false;
  }

  if (!persist) {
    const detection = await runUnifiedDetection({ userId, role: user.role });
    return NextResponse.json({ ok: true, ...detection, persisted: false });
  }

  const saved = await persistRankedRun({
    userId,
    role: user.role,
    scopeType: "user",
    scopeId: userId,
  });
  return NextResponse.json({
    ok: true,
    persisted: true,
    saved,
    created: saved.stats.created,
    deduped: saved.stats.deduped,
    refreshed: saved.stats.refreshed,
    archived: saved.stats.archived,
    guardrailRejected: saved.stats.guardrailRejected,
    guardrailByCode: saved.stats.guardrailByCode,
  });
}
