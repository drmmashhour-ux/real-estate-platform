import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { setGlobalAutopilotPause } from "@/modules/autopilot-governance/autopilot-global-pause.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const paused = Boolean(body.paused);
  const reason = typeof body.reason === "string" ? body.reason : "operator_pause";

  try {
    await setGlobalAutopilotPause({
      paused,
      actorUserId: auth.userId,
      reason,
    });
    return NextResponse.json({ ok: true, paused });
  } catch (e) {
    console.error("[full-autopilot/pause]", e);
    return NextResponse.json({ error: "pause_failed" }, { status: 500 });
  }
}
