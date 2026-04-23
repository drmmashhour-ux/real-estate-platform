import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { pauseAllAutonomy } from "@/modules/autonomy-command-center/autonomy-command-center-controls.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const paused = Boolean(body.paused);

  try {
    await pauseAllAutonomy(auth.userId, paused);
    return NextResponse.json({ ok: true, paused });
  } catch (e) {
    console.error("[autonomy-command-center/pause]", e);
    return NextResponse.json({ error: "pause_failed" }, { status: 500 });
  }
}
