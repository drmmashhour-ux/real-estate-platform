import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { runGrowthEngineCycle } from "@/modules/growth-engine";

export const dynamic = "force-dynamic";

/** POST /api/admin/growth-engine/run — authenticated platform admin only. */
export async function POST() {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const result = await runGrowthEngineCycle();
    return NextResponse.json({ ok: true, result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "run_failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
