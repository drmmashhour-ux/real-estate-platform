import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { emergencyKillAll } from "@/modules/autonomy-command-center/autonomy-command-center-controls.service";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    await emergencyKillAll(auth.userId);
    return NextResponse.json({ ok: true, killed: true });
  } catch (e) {
    console.error("[autonomy-command-center/emergency-kill]", e);
    return NextResponse.json({ error: "emergency_kill_failed" }, { status: 500 });
  }
}
