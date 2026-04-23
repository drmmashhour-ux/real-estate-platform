import { NextResponse } from "next/server";

import { requireMobileAdmin } from "@/modules/auth/mobile-auth";
import { setGlobalAutopilotPause } from "@/modules/autopilot-governance/autopilot-global-pause.service";

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

  const body = await request.json().catch(() => ({}));
  const paused = Boolean(body.paused);
  const reason = typeof body.reason === "string" ? body.reason : "mobile_operator_pause";

  await setGlobalAutopilotPause({
    paused,
    actorUserId: userId,
    reason,
  });

  return NextResponse.json({ ok: true, paused });
}
