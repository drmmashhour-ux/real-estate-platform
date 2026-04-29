import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  applyInvestorDemoSessionStart,
  applyInvestorDemoSessionStop,
  logDemoSessionEvent,
} from "@/lib/demo/demo-session";
import { executeInvestorDemoSeed } from "@/lib/sybnb/investor-demo-seed";
import { logTimelineEvent } from "@/lib/timeline/log-event";

export const dynamic = "force-dynamic";

/**
 * Admin-only JSON API — uses {@link getAdminUser} (403 when not admin); admin pages use {@link requireAdmin}.
 */
export async function POST() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const { sessionId, expiresAtIso } = applyInvestorDemoSessionStart();
    try {
      const summary = await executeInvestorDemoSeed(prisma);
      await logDemoSessionEvent("DEMO_SESSION_STARTED", { sessionId, actorId: admin.id });
      void logTimelineEvent({
        entityType: "investor_demo_session",
        entityId: sessionId,
        action: "demo_session_started",
        actorId: admin.id,
        actorRole: "admin",
        metadata: { expiresAtIso },
      });
      return NextResponse.json({
        ok: true,
        sessionId,
        expiresAt: expiresAtIso,
        seed: summary,
      });
    } catch (seedErr) {
      applyInvestorDemoSessionStop();
      throw seedErr;
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "demo_session_start_failed";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
