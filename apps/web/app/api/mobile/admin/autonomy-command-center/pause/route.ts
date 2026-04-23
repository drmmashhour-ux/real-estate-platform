import { NextResponse } from "next/server";

import { requireMobileAdmin } from "@/modules/auth/mobile-auth";
import { pauseAllAutonomy } from "@/modules/autonomy-command-center/autonomy-command-center-controls.service";

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

  try {
    await pauseAllAutonomy(userId, paused);
    return NextResponse.json({ ok: true, paused });
  } catch (e) {
    console.error("[mobile autonomy-command-center pause]", e);
    return NextResponse.json({ error: "pause_failed" }, { status: 500 });
  }
}
