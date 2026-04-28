import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  applyInvestorDemoSessionStart,
  applyInvestorDemoSessionStop,
  logDemoSessionEvent,
} from "@/lib/demo/demo-session";
import { executeInvestorDemoSeed } from "@/lib/sybnb/investor-demo-seed";

export const dynamic = "force-dynamic";

function isVercelOrProdRuntime(): boolean {
  return process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL_ENV);
}

/**
 * One-click full demo session (admin-only JSON API — uses {@link getAdminUser}; page flows use `requireAdmin`).
 *
 * Steps: UUID session → {@link applyInvestorDemoSessionStart} (runtime flags + 60m TTL + auto-clean) →
 * {@link executeInvestorDemoSeed} (demo-marked rows only). Hosted prod requires `INVESTOR_DEMO_IN_PRODUCTION=true`.
 */
export async function POST() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  if (isVercelOrProdRuntime() && process.env.INVESTOR_DEMO_IN_PRODUCTION !== "true") {
    return NextResponse.json(
      {
        ok: false,
        message: "Full demo start is not enabled for this production deployment. Set INVESTOR_DEMO_IN_PRODUCTION=true only on controlled demo hosts.",
      },
      { status: 403 },
    );
  }

  try {
    const { sessionId, expiresAtIso } = applyInvestorDemoSessionStart();
    try {
      await executeInvestorDemoSeed(prisma);
      await logDemoSessionEvent("DEMO_SESSION_STARTED", { sessionId, actorId: admin.id, flow: "start_full" });
      return NextResponse.json({
        ok: true,
        sessionId,
        expiresAt: expiresAtIso,
      });
    } catch (seedErr) {
      applyInvestorDemoSessionStop();
      throw seedErr;
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "demo_session_start_full_failed";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
