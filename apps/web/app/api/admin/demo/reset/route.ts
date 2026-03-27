import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { resetDemoDatabase } from "@/lib/demo-reset";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** POST — admin-only staging DB reset (same as cron, no CRON_SECRET). */
export async function POST() {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }
  try {
    await resetDemoDatabase();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/demo/reset]", e);
    const msg = e instanceof Error ? e.message : "Reset failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
