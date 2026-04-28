import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { applyInvestorDemoSessionStop, logDemoSessionEvent, runInvestorDemoResetThrottled } from "@/lib/demo/demo-session";

export const dynamic = "force-dynamic";

export async function POST() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const { hadAutoClean } = applyInvestorDemoSessionStop();
  await logDemoSessionEvent("DEMO_SESSION_STOPPED", { actorId: admin.id });

  let cleaned = false;
  if (hadAutoClean) {
    const r = await runInvestorDemoResetThrottled("session_stop");
    cleaned = !r.skipped && !r.error;
  }

  return NextResponse.json({
    ok: true,
    hadAutoClean,
    cleaned,
  });
}
