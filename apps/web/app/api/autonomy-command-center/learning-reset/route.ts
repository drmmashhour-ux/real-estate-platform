import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { recordLearningResetIntent } from "@/modules/autonomy-command-center/autonomy-command-center-controls.service";

export const dynamic = "force-dynamic";

/** Audit-only hook — destructive resets run via approved backend workflows. */
export async function POST() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    await recordLearningResetIntent(auth.userId);
    return NextResponse.json({ ok: true, recorded: true });
  } catch (e) {
    console.error("[autonomy-command-center/learning-reset]", e);
    return NextResponse.json({ error: "audit_failed" }, { status: 500 });
  }
}
