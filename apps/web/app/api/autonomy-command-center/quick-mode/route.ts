import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { applyQuickOperatingMode } from "@/modules/autonomy-command-center/autonomy-command-center-controls.service";
import type { QuickOperatingMode } from "@/modules/autonomy-command-center/autonomy-command-center.pure";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const mode = body.mode as QuickOperatingMode;
  if (mode !== "ASSIST" && mode !== "SAFE" && mode !== "FULL") {
    return NextResponse.json({ error: "invalid_quick_mode" }, { status: 400 });
  }

  try {
    await applyQuickOperatingMode(auth.userId, mode);
    return NextResponse.json({ ok: true, mode });
  } catch (e) {
    console.error("[autonomy-command-center/quick-mode]", e);
    return NextResponse.json({ error: "quick_mode_failed" }, { status: 500 });
  }
}
