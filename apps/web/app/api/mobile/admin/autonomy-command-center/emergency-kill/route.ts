import { NextResponse } from "next/server";

import { requireMobileAdmin } from "@/modules/auth/mobile-auth";
import { emergencyKillAll } from "@/modules/autonomy-command-center/autonomy-command-center-controls.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let userId: string;
  try {
    const u = await requireMobileAdmin(request);
    userId = u.id;
  } catch (e) {
    const status = (e as Error & { status?: number })?.status ?? 401;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }

  try {
    await emergencyKillAll(userId);
    return NextResponse.json({ ok: true, killed: true });
  } catch (e) {
    console.error("[mobile autonomy-command-center emergency-kill]", e);
    return NextResponse.json({ error: "emergency_kill_failed" }, { status: 500 });
  }
}
