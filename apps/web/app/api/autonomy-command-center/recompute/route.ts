import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { forceRecomputeAutonomySignals } from "@/modules/autonomy-command-center/autonomy-command-center-controls.service";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const result = await forceRecomputeAutonomySignals();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[autonomy-command-center/recompute]", e);
    return NextResponse.json({ error: "recompute_failed" }, { status: 500 });
  }
}
